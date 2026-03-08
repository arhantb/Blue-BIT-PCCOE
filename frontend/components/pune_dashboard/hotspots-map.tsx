"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: "high" | "medium" | "low";
  note: string;
}

const hotspots: Hotspot[] = [
  {
    id: "shivajinagar",
    name: "Shivajinagar",
    lat: 18.5302,
    lng: 73.8478,
    severity: "high",
    note: "Bus terminal spillover + narrow merges",
  },
  {
    id: "swargate",
    name: "Swargate",
    lat: 18.5018,
    lng: 73.8636,
    severity: "high",
    note: "Interchange + pedestrian crossings",
  },
  {
    id: "hinjewadi",
    name: "Hinjewadi",
    lat: 18.5986,
    lng: 73.7366,
    severity: "high",
    note: "IT peak wave + construction bottlenecks",
  },
  {
    id: "wakad",
    name: "Wakad",
    lat: 18.5997,
    lng: 73.7645,
    severity: "medium",
    note: "Expressway feeder queues",
  },
  {
    id: "hadapsar",
    name: "Hadapsar",
    lat: 18.5089,
    lng: 73.926,
    severity: "medium",
    note: "Freight + market activity",
  },
  {
    id: "kothrud",
    name: "Kothrud",
    lat: 18.5074,
    lng: 73.8077,
    severity: "low",
    note: "Signal coordination drift on arterials",
  },
];

function colorFor(severity: Hotspot["severity"]) {
  if (severity === "high") return "#fb923c"; // orange-400
  if (severity === "medium") return "#34d399"; // emerald-400
  return "#a7f3d0"; // emerald-200
}

function radiusFor(severity: Hotspot["severity"]) {
  if (severity === "high") return 18;
  if (severity === "medium") return 14;
  return 10;
}

export function PuneHotspotsMap() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(15,23,42,0.6)]">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Congestion hot spots
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Pune core + IT corridor heat nodes (sample data)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            High
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-200" />
            Low
          </span>
        </div>
      </header>

      <div className="h-[420px] w-full">
        <MapContainer
          center={[18.5204, 73.8567]}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {hotspots.map((h) => (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={radiusFor(h.severity)}
              fillColor={colorFor(h.severity)}
              color="#0f172a"
              weight={2}
              opacity={1}
              fillOpacity={0.75}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-center">
                  <div className="font-semibold">{h.name}</div>
                  <div className="text-xs">{h.note}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

