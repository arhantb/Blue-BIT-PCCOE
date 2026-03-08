"use client";

import React from "react";
import { CheckCircle2, FlaskConical, Target } from "lucide-react";

const sensors = [
  { name: "CCTV (YOLO Queue)", status: "Active", weight: 0.85, type: "Ground Truth" },
  { name: "GPS / AVL Probes", status: "Active", weight: 0.80, type: "Flow Velocity" },
  { name: "Metro Discharge", status: "Active", weight: 0.70, type: "Predictive Influx" },
  { name: "Ride Surge API", status: "Active", weight: 0.60, type: "Demand Trigger" },
];

export default function DataFusionPanel() {
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm h-full">
      <div className="flex items-center gap-3 mb-8">
        <FlaskConical className="w-5 h-5 text-gray-900" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Multi-Source Data Fusion</h3>
      </div>

      <div className="space-y-6">
        {/* Sensor List */}
        <div className="space-y-3">
          {sensors.map((s) => (
            <div key={s.name} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <div className="flex flex-col">
                   <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{s.name}</span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{s.type}</span>
                </div>
              </div>
              <div className="text-right">
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">Weight</span>
                 <span className="text-xs font-black text-orange-600">{s.weight.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Fusion Summary */}
        <div className="mt-8 p-6 bg-gray-950 rounded-sm text-center border-b-2 border-orange-500">
          <div className="flex items-center justify-center gap-2 mb-4">
             <Target className="w-4 h-4 text-orange-500" />
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Calculated Logic</span>
          </div>
          <code className="text-lg font-black tracking-tighter text-white">
            Final Queue Estimate = Weighted Fusion
          </code>
          <p className="mt-4 text-[10px] font-medium text-gray-500 leading-relaxed uppercase">
             Recursive Kalman Filtering applied to normalize sensor jitter and latency bias.
          </p>
        </div>
      </div>
    </div>
  );
}
