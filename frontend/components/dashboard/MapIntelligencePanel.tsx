"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, Globe, Layers, Cpu, Zap, Loader2 } from "lucide-react";
import { ATCSDecisionSchema } from "@/types/atcs";

// Fix for Leaflet marker icons in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  input: ATCSDecisionSchema["input"];
  flags: ATCSDecisionSchema["output"]["map_visualization_flags"];
}

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
    map.invalidateSize();
    map.setView(center, 14, { animate: true });
  }, [map, center]);
  return null;
}

export default function MapIntelligencePanel({ input, flags }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [osmData, setOsmData] = useState<{
    motorway: any[];
    primary: any[];
    secondary: any[];
    signals: any[];
    junctions: any[];
  }>({ motorway: [], primary: [], secondary: [], signals: [], junctions: [] });

  const [visibleLayers, setVisibleLayers] = useState({
    motorway: true,
    primary: true,
    secondary: true,
    signals: true,
    junctions: true
  });

  const [stats, setStats] = useState({ routes: 0, signals: 0, junctions: 0 });

  const center: [number, number] = React.useMemo(() => [
    input.location?.latitude || 18.5313, 
    input.location?.longitude || 73.8657
  ], [input.location?.latitude, input.location?.longitude]);

  const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
  
  // Calculate a bounding box around the current center
  const getBBox = (lat: number, lon: number) => {
    const offset = 0.015;
    return `${lat - offset},${lon - offset},${lat + offset},${lon + offset}`;
  };

  const fetchOSMData = useCallback(async () => {
    try {
      setLoading(true);
      const bbox = getBBox(center[0], center[1]);
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      const nodeMap: Record<number, { lat: number, lon: number }> = {};
      data.elements.forEach((el: OSMElement) => {
        if (el.type === 'node' && el.lat && el.lon) nodeMap[el.id] = { lat: el.lat, lon: el.lon };
      });

      const categorized = {
        motorway: [] as any[],
        primary: [] as any[],
        secondary: [] as any[],
        signals: [] as any[],
        junctions: [] as any[]
      };

      data.elements.forEach((el: OSMElement) => {
        if (el.type === 'way' && el.tags?.highway) {
          const hw = el.tags.highway;
          const coords = (el.nodes || [])
            .map(nid => nodeMap[nid])
            .filter(Boolean)
            .map(n => [n.lat, n.lon] as [number, number]);

          if (coords.length < 2) return;

          const item = { id: el.id, coords, tags: el.tags };
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

      setOsmData(categorized);
      setStats({
        routes: categorized.motorway.length + categorized.primary.length + categorized.secondary.length,
        signals: categorized.signals.length,
        junctions: categorized.junctions.length
      });
      setLoading(false);
    } catch (err) {
      console.error("OSM Fetch Error:", err);
      setLoading(false);
    }
  }, [center]);

  useEffect(() => {
    setIsMounted(true);
    fetchOSMData();
  }, [fetchOSMData]);

  const toggleLayer = (name: keyof typeof visibleLayers) => {
    setVisibleLayers(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const roadStyles = {
    motorway: { color: '#ef4444', weight: 4, opacity: 0.8 },
    primary: { color: '#f97316', weight: 3, opacity: 0.8 },
    secondary: { color: '#3b82f6', weight: 2, opacity: 0.7 }
  };

  const getSignalIcon = (tags: any) => {
    const isHigh = stats.signals > 0;
    const theme = isHigh ? { fill: '#ef4444', border: '#ffffff' } : { fill: '#eab308', border: '#ffffff' };
    return L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:${theme.fill};border:2px solid ${theme.border};box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  };

  const getJunctionIcon = () => L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;background:#a855f7;border:2px solid #ffffff;border-radius:2px;transform:rotate(45deg);box-shadow: 0 2px 4px rgba(0,0,0,0.15);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

  if (!isMounted) return <div className="h-full bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
      <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Initializing Mobility Map...</span>
    </div>
  </div>;

  return (
    <div className="bg-white border border-gray-200 rounded-sm h-full min-h-[700px] flex flex-col overflow-hidden relative shadow-sm">
      
      {/* TOP BAR STATS */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-b border-gray-100 px-8 py-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Globe className="w-5 h-5 text-orange-600" />
          <div>
            <h2 className="text-gray-900 text-[11px] font-black uppercase tracking-[0.2em] leading-none">Pune Mobility Grid</h2>
            <div className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">Real-time OSM Network Data</div>
          </div>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          {[
            { label: 'Routes', val: stats.routes, color: 'text-gray-900' },
            { label: 'Signals', val: stats.signals, color: 'text-red-500' },
            { label: 'Junctions', val: stats.junctions, color: 'text-purple-500' }
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded px-4 py-1.5 min-w-[70px] flex flex-col items-center shadow-sm">
              <span className={`text-[12px] font-black ${s.color}`}>{loading ? '...' : s.val}</span>
              <span className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAP CANVAS */}
      <div className="flex-1 relative z-0">
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
            <div className="w-10 h-10 border-2 border-gray-200 border-t-orange-600 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-gray-900 text-[10px] font-black uppercase tracking-[0.3em]">Querying Network Geometry</p>
              <p className="text-gray-400 text-[9px] mt-2">Connecting to OpenStreetMap @ Pune Region...</p>
            </div>
          </div>
        )}

        <MapContainer 
          center={center} 
          zoom={14} 
          className="h-full w-full"
          zoomControl={false}
        >
          <MapEffects center={center} />
          <ZoomControl position="bottomright" />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {/* ROAD LAYERS */}
          {visibleLayers.motorway && osmData.motorway.map(way => (
            <Polyline key={way.id} positions={way.coords} pathOptions={roadStyles.motorway} />
          ))}
          {visibleLayers.primary && osmData.primary.map(way => (
            <Polyline key={way.id} positions={way.coords} pathOptions={roadStyles.primary} />
          ))}
          {visibleLayers.secondary && osmData.secondary.map(way => (
            <Polyline key={way.id} positions={way.coords} pathOptions={roadStyles.secondary} />
          ))}

          {/* INFRASTRUCTURE MARKERS */}
          {visibleLayers.signals && osmData.signals.map(node => (
            <Marker key={node.id} position={[node.lat, node.lon]} icon={getSignalIcon(node.tags)}>
               <Popup className="light-popup">
                  <div className="p-1">
                     <div className="text-gray-900 text-[10px] font-black uppercase mb-1">{node.tags?.name || 'Traffic Signal'}</div>
                     <div className="text-red-600 text-[8px] font-bold uppercase tracking-widest border-b border-gray-100 pb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Real-time Node
                     </div>
                     <div className="mt-2 space-y-1">
                        <div className="text-[8px] text-gray-400 flex justify-between"><span>Location</span><span className="text-gray-600">{node.lat.toFixed(4)}, {node.lon.toFixed(4)}</span></div>
                     </div>
                  </div>
               </Popup>
            </Marker>
          ))}

          {visibleLayers.junctions && osmData.junctions.map(node => (
            <Marker key={node.id} position={[node.lat, node.lon]} icon={getJunctionIcon()}>
               <Popup className="light-popup">
                  <div className="p-1">
                     <div className="text-gray-900 text-[10px] font-black uppercase mb-1">{node.tags?.name || 'Major Junction'}</div>
                     <div className="text-purple-600 text-[8px] font-bold uppercase tracking-widest border-b border-gray-100 pb-1">Optimization Node</div>
                     <div className="mt-2 text-[8px] text-gray-400">Connectivity: Strategic Level</div>
                  </div>
               </Popup>
            </Marker>
          ))}

          {/* VENUE HUB */}
          <Marker position={center}>
            <Popup className="light-popup">
               <div className="p-1 min-w-[160px]">
                  <div className="text-orange-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Focus Zone</div>
                  <h4 className="text-gray-900 text-[12px] font-black uppercase mb-1">{input.venue.name}</h4>
                  <p className="text-gray-400 text-[9px] uppercase font-bold">{input.venue.type}</p>
                  <div className="h-[1px] w-full bg-gray-100 my-3" />
                  <div className="text-gray-600 text-[10px] font-medium leading-relaxed italic">
                     "{input.event_context.likely_event_today}"
                  </div>
               </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* SIDEBAR OVERLAY */}
        <div className="absolute top-24 left-6 z-[1000] space-y-4">
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 p-5 rounded-sm shadow-xl w-[220px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3 h-3 text-orange-600" />
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Map Layers</h3>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              {[
                { id: 'motorway', label: 'Highways / NHs', color: 'bg-red-500' },
                { id: 'primary', label: 'Primary Roads', color: 'bg-orange-500' },
                { id: 'secondary', label: 'Secondary Roads', color: 'bg-blue-500' },
                { id: 'signals', label: 'Traffic Signals', color: 'bg-red-600', isDot: true },
                { id: 'junctions', label: 'Major Junctions', color: 'bg-purple-500', isDiamond: true }
              ].map(layer => (
                <div 
                  key={layer.id} 
                  onClick={() => toggleLayer(layer.id as any)}
                  className={`group flex items-center justify-between cursor-pointer transition-all ${visibleLayers[layer.id as keyof typeof visibleLayers] ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div className="flex items-center gap-3">
                    {layer.isDot ? (
                      <div className={`w-2 h-2 rounded-full ${layer.color}`} />
                    ) : layer.isDiamond ? (
                      <div className={`w-2 h-2 rounded-[1px] rotate-45 ${layer.color}`} />
                    ) : (
                      <div className={`w-4 h-0.5 ${layer.color}`} />
                    )}
                    <span className="text-[9px] font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-tight">{layer.label}</span>
                  </div>
                  <div className={`w-6 h-3 rounded-full relative transition-colors ${visibleLayers[layer.id as keyof typeof visibleLayers] ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 rounded-full transition-all ${visibleLayers[layer.id as keyof typeof visibleLayers] ? 'right-0.5 bg-orange-600' : 'left-0.5 bg-gray-300'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 text-white p-3 rounded-sm shadow-xl flex items-center gap-3">
            <Cpu className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">System Level: Network Live</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .light-popup .leaflet-popup-content-wrapper {
          background: white !important;
          border: 1px solid rgba(0,0,0,0.05) !important;
          border-radius: 2px !important;
          color: #1a1a1a !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        .light-popup .leaflet-popup-tip {
          background: white !important;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
        .leaflet-control-zoom a {
          background: white !important;
          color: #666 !important;
          border-color: rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f8fafc !important;
          color: #000 !important;
        }
      `}</style>
    </div>
  );
}
