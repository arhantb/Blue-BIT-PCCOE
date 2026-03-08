"use client";

import React from "react";
import { Clock, BarChart3, TrendingUp, MoveRight } from "lucide-react";

export default function SignalOptimization() {
  const approaches = [
    { name: "North", before: 30, after: 30, color: "bg-gray-200" },
    { name: "South", before: 30, after: 25, color: "bg-gray-300" },
    { name: "East", before: 30, after: 45, color: "bg-orange-500" }, // Surge approach
    { name: "West", before: 30, after: 35, color: "bg-gray-400" },
  ];

  return (
    <div className="py-12 flex flex-col gap-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Fixed Baseline */}
        <div className="space-y-8">
           <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Before: Fixed Cycle (120s)</h3>
           </div>
           
           <div className="space-y-4">
              <div className="w-full h-12 bg-gray-100 rounded-md overflow-hidden flex shadow-inner">
                 {approaches.map((app, i) => (
                    <div 
                      key={i} 
                      className={`h-full border-r border-white/50 flex items-center justify-center text-[10px] font-black text-gray-600`}
                      style={{ width: `${(app.before / 120) * 100}%` }}
                    >
                       {app.name[0]}
                    </div>
                 ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {approaches.map((app, i) => (
                    <div key={i} className="text-center">
                       <span className="text-[10px] font-black text-gray-400 uppercase block">{app.name}</span>
                       <span className="text-xs font-bold text-gray-600">{app.before}s</span>
                    </div>
                 ))}
              </div>
           </div>
           <p className="text-xs text-gray-500 font-medium italic border-l-2 border-gray-200 pl-4 py-1">
              "Uniform splits lead to starvation on high-demand approaches like Hinjewadi Ph-1."
           </p>
        </div>

        {/* Dynamic Optimization */}
        <div className="space-y-8">
           <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">After: Dynamic Cycle (135s)</h3>
           </div>
           
           <div className="space-y-4">
              <div className="w-full h-12 bg-gray-100 rounded-md overflow-hidden flex shadow-md ring-2 ring-orange-100">
                 {approaches.map((app, i) => (
                    <div 
                      key={i} 
                      className={`h-full border-r border-white/20 flex items-center justify-center text-[10px] font-black ${app.name === "East" ? "text-white" : "text-gray-600"} ${app.color}`}
                      style={{ width: `${(app.after / 135) * 100}%` }}
                    >
                       {app.name[0]}
                    </div>
                 ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                 {approaches.map((app, i) => (
                    <div key={i} className="text-center">
                       <span className="text-[10px] font-black text-gray-400 uppercase block">{app.name}</span>
                       <span className={`text-xs font-black ${app.name === "East" ? "text-orange-600" : "text-gray-900"}`}>{app.after}s</span>
                    </div>
                 ))}
              </div>
           </div>
           
           <div className="bg-orange-50 p-6 rounded-md border border-orange-100 flex items-center gap-6">
              <div className="bg-orange-600 p-4 rounded-md text-white">
                 <BarChart3 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                 <h4 className="text-[11px] font-black uppercase tracking-widest text-orange-600 mb-1">Proportional Allocation</h4>
                 <p className="text-xs font-bold text-gray-900 leading-tight">
                    Green_i ∝ Priority_Score_i (Calculated via Pressure + Predicted Demand)
                 </p>
              </div>
              <MoveRight className="w-5 h-5 text-orange-300 hidden md:block" />
           </div>
        </div>

      </div>
    </div>
  );
}
