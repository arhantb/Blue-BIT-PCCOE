"use client";

import React from "react";
import { Activity, BarChart3, Info } from "lucide-react";

interface MetricsPanelProps {
  isPredictive: boolean;
  surgeActive: boolean;
  kalmanGain: number;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  isPredictive,
  surgeActive,
  kalmanGain,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* System Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <h4 className="font-bold text-gray-800">Adaptive Status</h4>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Coordination Mode</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPredictive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {isPredictive ? "GREEN WAVE" : "STATIC SPLITS"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Demand Pressure</span>
            <span className={`font-bold ${surgeActive ? "text-red-500" : "text-green-600"}`}>
              {surgeActive ? "CRITICAL" : "OPTIMAL"}
            </span>
          </div>
        </div>
      </div>

      {/* Kalman Filter Visualizer */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm md:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-800">Kalman State Estimation</h4>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full" /> Raw Sensor (Noise)</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Kalman Predict</div>
          </div>
        </div>

        <div className="h-24 flex items-end gap-1.5 px-2">
           {/* Mock bars for Kalman/Raw visual */}
           {[...Array(24)].map((_, i) => {
             const hRaw = Math.sin(i * 0.5) * 20 + 40 + (Math.random() - 0.5) * 15;
             const hKal = Math.sin(i * 0.5) * 20 + 40;
             return (
               <div key={i} className="flex-1 flex flex-col items-center gap-0.5 justify-end group cursor-help">
                  <div className="w-full bg-blue-100/50 rounded-t-sm transition-all duration-500 group-hover:bg-blue-200" style={{ height: `${hKal}%` }} />
                  <div className="w-1/2 bg-red-400/30 rounded-t-sm absolute" style={{ height: `${hRaw}%` }} />
               </div>
             )
           })}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
           <span className="flex items-center gap-1">
             <Info className="w-3 h-3" />
             Recursive state estimation smoothing camera-based vehicle counts
           </span>
           <span className="font-mono text-blue-600">Gain: {kalmanGain.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
