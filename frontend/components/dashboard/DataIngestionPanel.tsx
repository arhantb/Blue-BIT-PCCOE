"use client";

import React from "react";
import { Users, Activity, Cloud, Navigation, Train, Loader2, Zap } from "lucide-react";
import { ATCSDecisionSchema } from "@/types/atcs";

interface Props {
  input: ATCSDecisionSchema["input"];
}

export default function DataIngestionPanel({ input }: Props) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH": return "text-red-600 bg-red-50 border-red-100";
      case "MODERATE": return "text-orange-600 bg-orange-50 border-orange-100";
      case "LOW": return "text-green-600 bg-green-50 border-green-100";
      case "CLEAR": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  const mappls = input.mappls_live_traffic;

  return (
    <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden h-full">
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-600" />
          Data Ingestion Stream
        </h3>
        <span className="text-[9px] font-bold text-gray-400 uppercase animate-pulse">Live Polling</span>
      </div>

      <div className="p-6 space-y-5">
        {/* Attendance */}
        <div className="flex items-center justify-between group border-b border-gray-50 pb-3">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-50 rounded-sm text-orange-600 border border-orange-100">
                <Users className="w-4 h-4" />
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Attendance</span>
                <span className="text-sm font-black text-gray-900">{input.event_context.estimated_attendance} ({input.venue.capacity} Limit)</span>
             </div>
          </div>
          <span className="text-[10px] font-black text-white bg-orange-600 px-2 py-0.5 rounded-sm uppercase tracking-tighter">Live</span>
        </div>

        {/* Congestion Index */}
        <div className="flex items-center justify-between border-b border-gray-50 pb-3">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-red-50 rounded-sm text-red-600 border border-red-100">
                <Navigation className="w-4 h-4" />
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Congestion Index</span>
                <span className="text-sm font-black text-gray-900">{input.traffic_prediction.congestion_index}{input.traffic_prediction.congestion_index <= 10 ? '/10' : ''}</span>
             </div>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm border ${getSeverityColor(input.traffic_prediction.severity)}`}>
            {input.traffic_prediction.severity}
          </span>
        </div>

        {/* Weather Intelligence */}
        <div className="space-y-3 border-b border-gray-50 pb-3">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-50 rounded-sm text-blue-600 border border-blue-100">
                    <Cloud className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Weather Engine</span>
                    <span className="text-sm font-black text-gray-900">{input.weather.condition} ({input.weather.temperature_c}°C)</span>
                 </div>
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{input.weather.humidity_percent}% Humidity</span>
           </div>
           <p className="text-[9px] font-bold text-blue-500 bg-blue-50/50 px-3 py-1 rounded-sm border border-blue-100/50">
              {input.weather.traffic_weather_impact}
           </p>
        </div>

        {/* Mappls Live Flow */}
        <div className="space-y-3 border-b border-gray-50 pb-3">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-50 rounded-sm text-purple-600 border border-purple-100">
                    <Zap className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mappls Live Flow</span>
                    <span className="text-sm font-black text-gray-900">{mappls["Average Speed (km/h)"]} KM/H</span>
                 </div>
              </div>
              <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-50 px-2 py-0.5 rounded-sm">{mappls["Congestion Level"]}</span>
           </div>
           <div className="flex items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
              <span>Delay: {mappls["Traffic Delay (min)"]} Min</span>
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <span>Range: {mappls["Distance (km)"]} KM</span>
           </div>
        </div>

        {/* Metro Connectivity */}
        {input.nearest_metro_station && !input.nearest_metro_station.error ? (
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-50 rounded-sm text-indigo-600 border border-indigo-100">
                    <Train className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Metro Integration</span>
                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-tighter">{input.nearest_metro_station.station_name}</span>
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-black text-indigo-600 underline">T-Minus {input.nearest_metro_station.walking_time_mins}m Walk</span>
                 <span className="text-[8px] font-bold text-gray-400">{input.nearest_metro_station.distance_km} KM Dist</span>
              </div>
           </div>
        ) : (
           <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-sm border border-gray-100 opacity-50">
              <Train className="w-4 h-4 text-gray-400" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Metro Data Unavailable</span>
           </div>
        )}

        {/* Confidence Unit */}
        <div className="pt-2 border-t border-gray-100">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Fusion Engine Confidence</span>
              <span className="text-xs font-black text-orange-600">{input.traffic_prediction.confidence}%</span>
           </div>
           <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-1000" 
                style={{ width: `${input.traffic_prediction.confidence}%` }}
              />
           </div>
        </div>
      </div>
    </div>
  );
}
