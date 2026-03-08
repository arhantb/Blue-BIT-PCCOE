"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl, Circle, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ForecastDecision } from "@/types/forecastDecision";
import { ExternalLink, Info, AlertTriangle, ArrowRight } from "lucide-react";

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OSMElement {
  type: 'node' | 'way';
  id: number;
  lat?: number;
  lon?: number;
  nodes?: number[];
  tags?: Record<string, string>;
}

function MapEffects({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !center) return;
    try {
        map.invalidateSize();
        map.setView(center, 15, { animate: true });
    } catch (e) {
        console.warn("Leaflet MapEffects Error:", e);
    }
  }, [map, center]);
  return null;
}

interface Props {
  data: ForecastDecision;
  visibleLayers: {
    motorway: boolean;
    primary: boolean;
    secondary: boolean;
    signals: boolean;
    junctions: boolean;
  };
  onStatsUpdate?: (stats: { routes: number; signals: number; junctions: number }) => void;
}

export default function ForecastMap({ data, visibleLayers, onStatsUpdate }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [osmData, setOsmData] = useState<{
    motorway: any[];
    primary: any[];
    secondary: any[];
    signals: any[];
    junctions: any[];
  }>({ motorway: [], primary: [], secondary: [], signals: [], junctions: [] });

  const center: [number, number] = useMemo(() => [
    data?.location?.latitude || 18.5313,
    data?.location?.longitude || 73.8657
  ], [data?.location]);

  // Prevent recursive updates by firing stats update through an effect
  useEffect(() => {
    if (osmData.motorway.length > 0 || osmData.signals.length > 0) {
        const stats = {
            routes: osmData.motorway.length + osmData.primary.length + osmData.secondary.length,
            signals: osmData.signals.length,
            junctions: osmData.junctions.length
        };
        onStatsUpdate?.(stats);
    }
  }, [osmData, onStatsUpdate]);

  const getBBox = (lat: number, lon: number) => {
    const offset = 0.025; 
    return `${lat - offset},${lon - offset},${lat + offset},${lon + offset}`;
  };

  const fetchOSMData = useCallback(async (retryCount = 0) => {
    const bbox = getBBox(center[0], center[1]);
    const cacheKey = `osm_cache_${bbox.replace(/,/g, '_')}`;
    
    // Check Cache First
    const cached = typeof localStorage !== 'undefined' ? localStorage.getItem(cacheKey) : null;
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < 3600000) { // 1 hour cache
                setOsmData(parsed.data);
                setLoading(false);
                return;
            }
        } catch (e) { localStorage.removeItem(cacheKey); }
    }

    try {
      setLoading(true);
      const query = `
        [out:json][timeout:60];
        (
          way["highway"~"^(motorway|motorway_link|trunk|trunk_link)$"](${bbox});
          way["highway"~"^(primary|primary_link)$"](${bbox});
          way["highway"~"^(secondary|secondary_link)$"](${bbox});
          node["highway"="traffic_signals"](${bbox});
          node["highway"~"^(motorway_junction|turning_circle|mini_roundabout|roundabout)$"](${bbox});
          node["junction"](${bbox});
        );
        out body;
        >;
        out skel qt;
      `.trim();

      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      });

      if (response.status === 429) {
          if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 2000;
              console.warn(`Overpass 429: Retrying in ${delay}ms...`);
              setTimeout(() => fetchOSMData(retryCount + 1), delay);
              return;
          }
          throw new Error("Overpass API Rate Limit Exceeded. Using cached/empty data.");
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const osmResult = await response.json();
      
      const nodeMap: Record<number, { lat: number, lon: number }> = {};
      osmResult.elements.forEach((el: OSMElement) => {
        if (el.type === 'node' && el.lat && el.lon) nodeMap[el.id] = { lat: el.lat, lon: el.lon };
      });

      const categorized = {
        motorway: [] as any[],
        primary: [] as any[],
        secondary: [] as any[],
        signals: [] as any[],
        junctions: [] as any[]
      };

      osmResult.elements.forEach((el: OSMElement) => {
        if (el.type === 'way' && el.tags?.highway) {
          const hw = el.tags.highway;
          const coords = (el.nodes || [])
            .map(nid => nodeMap[nid])
            .filter(Boolean)
            .map(n => [n.lat, n.lon] as [number, number]);

          if (coords.length < 2) return;

          const item = { id: el.id, coords, tags: el.tags, type: hw };
          if (hw.startsWith('motorway') || hw.startsWith('trunk')) categorized.motorway.push(item);
          else if (hw.startsWith('primary')) categorized.primary.push(item);
          else categorized.secondary.push(item);
        } else if (el.type === 'node' && el.tags) {
          if (el.tags.highway === 'traffic_signals') {
            categorized.signals.push({ id: el.id, lat: el.lat, lon: el.lon, tags: el.tags });
          } else if (el.tags.highway || el.tags.junction) {
            categorized.junctions.push({ id: el.id, lat: el.lat, lon: el.lon, tags: el.tags });
          }
        }
      });

      const stats = {
        routes: categorized.motorway.length + categorized.primary.length + categorized.secondary.length,
        signals: categorized.signals.length,
        junctions: categorized.junctions.length
      };

      // Update Cache
      localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: categorized,
          stats
      }));

      setOsmData(categorized);
      setLoading(false);
    } catch (err) {
      console.error("OSM Fetch Error:", err);
      if (cached) {
         const parsed = JSON.parse(cached);
         setOsmData(parsed.data);
      }
      setLoading(false);
    }
  }, [center]);

  useEffect(() => {
    setIsMounted(true);
    fetchOSMData();
  }, [fetchOSMData]);

  const getRoadStyle = useCallback((way: any) => {
    const name = (way.tags.name || "").toLowerCase();
    const avoidRoads = data?.data?.recommendations?.avoid_roads || data?.recommendations?.avoid_roads || [];
    const suggestedRoutes = data?.data?.recommendations?.suggested_routes || data?.recommendations?.suggested_routes || [];

    const avoid = avoidRoads.some(r => name.includes(r.toLowerCase()));
    const suggested = suggestedRoutes.some(r => name.includes(r.toLowerCase()));

    if (avoid) return { color: '#ef4444', weight: 6, opacity: 0.9, className: 'glow-red' };
    if (suggested) return { color: '#22c55e', weight: 5, opacity: 0.9, className: 'glow-green' };

    switch(way.type) {
        case 'motorway': return { color: '#94a3b8', weight: 4, opacity: 0.6 };
        case 'primary': return { color: '#cbd5e1', weight: 3, opacity: 0.5 };
        default: return { color: '#e2e8f0', weight: 2, opacity: 0.4 };
    }
  }, [data]);

  const signalIcon = useMemo(() => {
    if (typeof window === "undefined") return null;
    return L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid #ffffff;box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  }, []);

  const venueIcon = useMemo(() => {
    if (typeof window === "undefined") return null;
    return L.divIcon({
        className: '',
        html: `<div style="background:#f97316; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow: 0 4px 15px rgba(249,115,22,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
  }, []);

  if (!isMounted) return <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-400 font-black uppercase tracking-[0.3em]">Initializing Network Map...</div>;

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        key={`forecast-map-${center[0]}-${center[1]}`}
        center={center} 
        zoom={15} 
        className="h-full w-full"
        zoomControl={false}
      >
        <MapEffects center={center} />
        <ZoomControl position="bottomright" />
        
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {visibleLayers.motorway && osmData.motorway.map(way => (
          <Polyline key={way.id} positions={way.coords} pathOptions={getRoadStyle(way)}>
            <Popup>
              <div className="text-gray-900 text-[10px] font-bold uppercase">{way.tags.name || way.type}</div>
            </Popup>
          </Polyline>
        ))}
        {visibleLayers.primary && osmData.primary.map(way => (
          <Polyline key={way.id} positions={way.coords} pathOptions={getRoadStyle(way)}>
            <Popup>
               <div className="text-gray-900 text-[10px] font-bold uppercase">{way.tags.name || way.type}</div>
            </Popup>
          </Polyline>
        ))}
        {visibleLayers.secondary && osmData.secondary.map(way => (
          <Polyline key={way.id} positions={way.coords} pathOptions={getRoadStyle(way)}>
             <Popup>
               <div className="text-gray-900 text-[10px] font-bold uppercase">{way.tags.name || way.type}</div>
            </Popup>
          </Polyline>
        ))}

        {visibleLayers.signals && signalIcon && osmData.signals.map(node => (
          <Marker key={node.id} position={[node.lat, node.lon]} icon={signalIcon}>
            <Popup>
              <div className="p-1">
                <div className="font-bold text-gray-900 mb-1">{node.tags.name || 'Traffic Signal'}</div>
                <div className="text-[9px] text-red-500 font-bold uppercase">Proactive Split Control</div>
              </div>
            </Popup>
          </Marker>
        ))}

        <Circle
            center={center}
            radius={500}
            pathOptions={{fillColor: '#ef4444', fillOpacity: 0.1, color: '#ef4444', weight: 2, dashArray: '5, 10'}}
        >
            <Tooltip permanent direction="top" className="zone-label-l2">
                <div className="px-2 py-1 bg-red-600 text-white text-[9px] font-black rounded shadow-lg uppercase">L2: 0-500m (Critical)</div>
            </Tooltip>
        </Circle>
        
        <Circle
            center={center}
            radius={2000}
            pathOptions={{fillColor: '#f97316', fillOpacity: 0.05, color: '#f97316', weight: 1, dashArray: '10, 20'}}
        >
            <Tooltip permanent direction="bottom" className="zone-label-l1">
                <div className="px-2 py-1 bg-orange-400 text-white text-[9px] font-black rounded shadow-lg uppercase">L1: 500m-2km (Moderate)</div>
            </Tooltip>
        </Circle>

        {venueIcon && (
            <Marker position={center} icon={venueIcon}>
                <Popup>
                    <div className="p-2 min-w-[180px]">
                        <div className="text-orange-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                        <span>Proactive Focal Venue</span>
                        <a href={data.location?.google_maps_link} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-3 h-3 text-gray-400 hover:text-gray-900 transition-colors" />
                        </a>
                        </div>
                        <div className="text-gray-900 font-black text-xs leading-tight underline decoration-orange-400 underline-offset-4">{data?.data?.venue?.name || data?.venue?.name || "Local Area"}</div>
                        <div className="mt-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-gray-900 uppercase leading-none">AI Pred: {data?.data?.traffic_prediction?.congestion_index || data?.confidence || 0}%</div>
                            <div className="text-[7px] text-gray-400 font-bold uppercase mt-1">Status: Surge Imminent</div>
                        </div>
                        </div>
                    </div>
                </Popup>
            </Marker>
        )}

      </MapContainer>

      {/* BALANCING LEGEND */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md border border-gray-100 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
         <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Traffic Balance Strategy</h4>
         <div className="flex items-center gap-3">
            <div className="w-8 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-black text-gray-900">CONGESTED Corridors</span>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-8 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-black text-gray-900">DIVERSION Outlets</span>
         </div>
         <p className="text-[8px] text-gray-400 font-bold italic mt-2">*Live balancing based on internal road utilization</p>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          <div className="w-10 h-10 border-2 border-gray-100 border-t-orange-400 rounded-full animate-spin" />
          <div className="text-center px-8">
            <p className="text-gray-900 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Calculating Multi-Node Flow</p>
            <p className="text-gray-400 text-[9px] mt-2 font-bold uppercase tracking-widest">Proactive Balancing Engine Active</p>
          </div>
        </div>
      )}

      <style jsx global>{`
        .leaflet-popup-content-wrapper { background: white !important; border: 1px solid rgba(0,0,0,0.05) !important; border-radius: 12px !important; color: #333 !important; box-shadow: 0 15px 45px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-tip { background: white !important; }
        .leaflet-container { background: #f8fafc !important; }
        .zone-label-l2, .zone-label-l1 { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .zone-label-l2::before, .zone-label-l1::before { display: none !important; }
        .glow-red { filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.8)); }
        .glow-green { filter: drop-shadow(0 0 4px rgba(34, 197, 129, 0.8)); }
        .leaflet-control-zoom a { background: white !important; color: #666 !important; border: 1px solid rgba(0,0,0,0.1) !important; border-radius: 8px !important; margin-bottom: 4px !important; }
        .leaflet-control-zoom a:hover { background: #f8fafc !important; color: #000 !important; }
      `}</style>
    </div>
  );
}
