"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl, Polyline, Tooltip, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RoadStyle {
    color: string;
    weight: number;
    opacity: number;
}

const roadStyles: Record<string, RoadStyle> = {
  motorway:      { color: '#e8534a', weight: 4, opacity: 0.9 },
  primary:       { color: '#f0a500', weight: 3, opacity: 0.85 },
  secondary:     { color: '#0ea5e9', weight: 2, opacity: 0.8 },
};

interface ProcessedRoad {
    id: number;
    highway: string;
    positions: [number, number][];
    name: string;
}

interface Props {
    isSimulationRunning: boolean;
    onSimulationEnd: () => void;
    visibleLayers: {
        motorway: boolean;
        primary: boolean;
        secondary: boolean;
        signals: boolean;
        junctions: boolean;
    };
    onStatsUpdate: (stats: { routes: number, signals: number, junctions: number }) => void;
}

function AnimatedVehicle({ isRunning, onEnd, congestedPath, diversionPath }: { 
    isRunning: boolean; 
    onEnd: () => void;
    congestedPath: [number, number][];
    diversionPath: [number, number][];
}) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [pathIndex, setPathIndex] = useState(0);
    const [phase, setPhase] = useState<'congested' | 'diversion'>('congested');
    const map = useMap();

    const carIcon = useMemo(() => {
        if (typeof window === "undefined") return null;
        return L.divIcon({
            className: 'custom-car-icon',
            html: `
                <div class="relative flex items-center justify-center">
                    <div class="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping"></div>
                    <div class="relative w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                        <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });
    }, []);

    useEffect(() => {
        if (congestedPath.length > 0 && !position) {
            setPosition(congestedPath[0]);
        }
    }, [congestedPath, position]);

    useEffect(() => {
        if (!isRunning || congestedPath.length === 0 || diversionPath.length === 0) return;

        let currentPath = phase === 'congested' ? congestedPath : diversionPath;
        
        if (pathIndex >= currentPath.length - 1) {
            if (phase === 'congested') {
                setPhase('diversion');
                setPathIndex(0);
                return;
            } else {
                onEnd();
                return;
            }
        }

        const start = currentPath[pathIndex];
        const end = currentPath[pathIndex + 1];
        let step = 0;
        const totalSteps = 15;

        const interval = setInterval(() => {
            step++;
            const lat = start[0] + (end[0] - start[0]) * (step / totalSteps);
            const lng = start[1] + (end[1] - start[1]) * (step / totalSteps);
            const newPos: [number, number] = [lat, lng];
            setPosition(newPos);
            
            if (step === totalSteps) {
                map.panTo(newPos, { animate: true, duration: 0.2 });
            }

            if (step >= totalSteps) {
                clearInterval(interval);
                setPathIndex(prev => prev + 1);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [isRunning, pathIndex, phase, map, onEnd, congestedPath, diversionPath]);

    if (!position || !carIcon) return null;
    return <Marker position={position} icon={carIcon} />;
}

export default function ReroutingMap({ isSimulationRunning, onSimulationEnd, visibleLayers, onStatsUpdate }: Props) {
    const [isMounted, setIsMounted] = useState(false);
    const [networkData, setNetworkData] = useState<{ roads: ProcessedRoad[], signals: any[], junctions: any[] }>({
        roads: [],
        signals: [],
        junctions: []
    });
    const [simPaths, setSimPaths] = useState<{ congested: [number, number][], diversion: [number, number][] }>({
        congested: [],
        diversion: []
    });
    const [isLoading, setIsLoading] = useState(true);

    // Prevent recursive updates by firing stats update through an effect
    useEffect(() => {
        if (networkData.roads.length > 0 || networkData.signals.length > 0) {
            onStatsUpdate({
                routes: networkData.roads.length,
                signals: networkData.signals.length,
                junctions: networkData.junctions.length
            });
        }
    }, [networkData, onStatsUpdate]);

    const stitchRoads = (ways: any[], nodeMap: Record<number, [number, number]>, targetName: string): [number, number][] => {
        const matchingWays = ways.filter(w => w.tags.name?.toLowerCase().includes(targetName.toLowerCase()));
        if (matchingWays.length === 0) return [];

        let stitchedNodes: number[] = [];
        let remainingWays = [...matchingWays];

        stitchedNodes = [...remainingWays[0].nodes];
        remainingWays.shift();

        let changed = true;
        while (changed && remainingWays.length > 0) {
            changed = false;
            for (let i = 0; i < remainingWays.length; i++) {
                const way = remainingWays[i];
                if (way.nodes[0] === stitchedNodes[stitchedNodes.length - 1]) {
                    stitchedNodes.push(...way.nodes.slice(1));
                    remainingWays.splice(i, 1);
                    changed = true;
                    break;
                } else if (way.nodes[way.nodes.length - 1] === stitchedNodes[0]) {
                    stitchedNodes.unshift(...way.nodes.slice(0, -1));
                    remainingWays.splice(i, 1);
                    changed = true;
                    break;
                } else if (way.nodes[way.nodes.length - 1] === stitchedNodes[stitchedNodes.length - 1]) {
                    stitchedNodes.push(...way.nodes.slice(0, -1).reverse());
                    remainingWays.splice(i, 1);
                    changed = true;
                    break;
                } else if (way.nodes[0] === stitchedNodes[0]) {
                    stitchedNodes.unshift(...way.nodes.slice(1).reverse());
                    remainingWays.splice(i, 1);
                    changed = true;
                    break;
                }
            }
        }

        return stitchedNodes.map(nid => nodeMap[nid]).filter(Boolean);
    };

    const fetchOSMData = useCallback(async () => {
        setIsLoading(true);
        try {
            const BBOX = "18.45,73.78,18.52,73.88";
            const query = `
                [out:json][timeout:60];
                (
                  way["highway"~"^(motorway|trunk|primary|secondary)$"](${BBOX});
                  node["highway"="traffic_signals"](${BBOX});
                  node["junction"](${BBOX});
                );
                out body;
                >;
                out skel qt;
            `;
            const response = await fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                body: query
            });
            const data = await response.json();
            
            const nodeMap: Record<number, [number, number]> = {};
            data.elements.filter((e: any) => e.type === "node").forEach((n: any) => {
                nodeMap[n.id] = [n.lat, n.lon];
            });

            const rawWays = data.elements.filter((e: any) => e.type === "way" && e.tags?.highway);
            const signals = data.elements.filter((e: any) => e.type === "node" && e.tags?.highway === "traffic_signals");
            const junctions = data.elements.filter((e: any) => e.type === "node" && (e.tags?.highway?.includes("junction") || e.tags?.junction));

            const processedRoads: ProcessedRoad[] = rawWays
                .map((w: any) => ({
                    id: w.id,
                    highway: w.tags.highway,
                    name: w.tags.name || "Road",
                    positions: w.nodes.map((nid: number) => nodeMap[nid]).filter(Boolean)
                }))
                .filter((r: any) => r.positions.length >= 2);

            setNetworkData({ roads: processedRoads, signals, junctions });

            const START: [number, number] = [18.5080, 73.8055];
            const DEST: [number, number] = [18.4644, 73.8675];

            const karveFull = stitchRoads(rawWays, nodeMap, "Karve Road");
            const paudFull = stitchRoads(rawWays, nodeMap, "Paud Road");
            const combinedCongested = [...paudFull, ...karveFull].filter((v, i, a) => !i || (v[0] !== a[i-1][0] || v[1] !== a[i-1][1]));

            const sataraFull = stitchRoads(rawWays, nodeMap, "Satara Road");
            const bibFull = stitchRoads(rawWays, nodeMap, "Bibwewadi");
            const combinedDiversion = [...sataraFull, ...bibFull].filter((v, i, a) => !i || (v[0] !== a[i-1][0] || v[1] !== a[i-1][1]));

            const trimPath = (path: [number, number][], s: [number, number], d: [number, number]) => {
                if (path.length < 2) return [s, d];
                return [s, ...path.slice(0, 40), d] as [number, number][];
            };

            setSimPaths({
                congested: trimPath(combinedCongested, START, DEST),
                diversion: trimPath(combinedDiversion, START, DEST)
            });
            
        } catch (error) {
            console.error("OSM Fetch Error:", error);
            const START: [number, number] = [18.5080, 73.8055];
            const DEST: [number, number] = [18.4644, 73.8675];
            setSimPaths({
                congested: [START, [18.50, 73.82], [18.48, 73.84], DEST],
                diversion: [START, [18.48, 73.81], [18.46, 73.83], DEST]
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsMounted(true);
        fetchOSMData();
    }, [fetchOSMData]);

    const junctionDiamondIcon = useMemo(() => {
        if (typeof window === "undefined") return null;
        return L.divIcon({
            className: '',
            html: `<div style="width:10px;height:10px;background:#aa44ff;transform:rotate(45deg);border:1px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>`
        });
    }, []);

    if (!isMounted) return <div className="h-full w-full bg-slate-50 flex items-center justify-center font-black uppercase text-[10px] text-slate-400">Loading Map Engine...</div>;

    return (
        <div className="h-full w-full relative">
            <MapContainer 
                key="rerouting-map-container"
                center={[18.48, 73.84]} 
                zoom={14} 
                className="h-full w-full"
                zoomControl={false}
            >
                {/* Safer Zoom Control rendering */}
                <ZoomControl position="bottomright" />
                
                <TileLayer
                    attribution='&copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* NETWORK ROADS */}
                {networkData.roads.map((road) => {
                    const hw = road.highway;
                    const styleKey = hw.includes('motorway') || hw.includes('trunk') ? 'motorway' : hw.includes('primary') ? 'primary' : 'secondary';
                    if (!visibleLayers[styleKey as keyof typeof visibleLayers]) return null;

                    return (
                        <Polyline 
                            key={`road-${road.id}`}
                            positions={road.positions}
                            pathOptions={roadStyles[styleKey] || roadStyles.secondary}
                        />
                    );
                })}

                {/* SIGNALS */}
                {visibleLayers.signals && networkData.signals.map((sig, idx) => (
                    <Circle 
                        key={`sig-${idx}`}
                        center={[sig.lat, sig.lon]}
                        radius={15}
                        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.5, weight: 1 }}
                    />
                ))}

                {/* JUNCTIONS */}
                {visibleLayers.junctions && junctionDiamondIcon && networkData.junctions.map((jn, idx) => (
                    <Marker 
                        key={`jn-${idx}`}
                        position={[jn.lat, jn.lon]}
                        icon={junctionDiamondIcon}
                    />
                ))}

                {/* HIGH-FIDELITY SIMULATION OVERLAYS */}
                {simPaths.congested.length > 0 && (
                    <Polyline 
                        positions={simPaths.congested} 
                        pathOptions={{ color: '#ef4444', weight: 8, opacity: 0.8, lineJoin: 'round', lineCap: 'round' }} 
                    >
                         <Tooltip permanent direction="top" className="path-tooltip">
                            <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase border border-white/20">
                                Congested Corridor
                            </div>
                        </Tooltip>
                    </Polyline>
                )}

                {simPaths.diversion.length > 0 && (
                    <Polyline 
                        positions={simPaths.diversion} 
                        pathOptions={{ color: '#22c55e', weight: 8, opacity: 0.6, dashArray: '10, 10', lineJoin: 'round', lineCap: 'round' }} 
                    >
                        <Tooltip permanent direction="bottom" className="path-tooltip">
                            <div className="bg-green-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg uppercase border border-white/20">
                                Diversion Route
                            </div>
                        </Tooltip>
                    </Polyline>
                )}

                {!isLoading && (
                    <AnimatedVehicle 
                        isRunning={isSimulationRunning} 
                        onEnd={onSimulationEnd} 
                        congestedPath={simPaths.congested}
                        diversionPath={simPaths.diversion}
                    />
                )}

            </MapContainer>

            {isLoading && (
                <div className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Building Road Geometry...</span>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .leaflet-container { background: #f8fafc !important; }
                .path-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
                .path-tooltip::before { display: none !important; }
            `}</style>
        </div>
    );
}
