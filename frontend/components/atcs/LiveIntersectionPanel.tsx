"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Info } from "lucide-react";

const approaches = [
  { dir: "East", queue: 18, inflow: "+32%", load: "Low", priority: 0.78, trend: "up" },
  { dir: "North", queue: 9, inflow: "+12%", load: "Medium", priority: 0.42, trend: "up" },
  { dir: "South", queue: 6, inflow: "+5%", load: "Low", priority: 0.30, trend: "down" },
  { dir: "West", queue: 11, inflow: "+18%", load: "High", priority: 0.51, trend: "up" },
];

export default function LiveIntersectionPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 border-b-2 border-orange-500 pb-1 flex items-center gap-2">
          Intersection Telemetry <span className="text-gray-400 font-bold ml-2">#WAKAD-04</span>
        </h3>
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
           Live Stream Processing
        </div>
      </div>

      {/* Grid of Approach Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {approaches.map((app) => (
          <div key={app.dir} className="bg-white border border-gray-100 p-5 rounded-sm shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xl font-black text-gray-950 tracking-tighter uppercase">{app.dir}</span>
              <div className={`p-1.5 rounded-sm ${app.trend === "up" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                {app.trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Queue</span>
                  <span className="text-2xl font-black text-gray-900">{app.queue}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inflow</span>
                  <span className={`text-lg font-black ${app.trend === "up" ? "text-orange-600" : "text-green-600"}`}>{app.inflow}</span>
               </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Load</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${app.load === "High" ? "bg-red-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                     {app.load}
                  </span>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-gray-400 uppercase">Priority</span>
                  <span className="text-xs font-black text-gray-900">{app.priority.toFixed(2)}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Decision Summary */}
      <div className="bg-gray-950 p-6 rounded-sm text-white flex flex-col md:flex-row items-center justify-between gap-8 border-l-4 border-orange-600">
        <div className="flex-1 space-y-4">
           <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Optimization Decision</h4>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Selected Phase</span>
                 <span className="text-2xl font-black text-white uppercase tracking-tighter">East-West Main Flow</span>
              </div>
              <div>
                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Green Allocation</span>
                 <span className="text-2xl font-black text-orange-500 tracking-tighter">45s <span className="text-xs text-gray-600 font-bold ml-1">+12s Extension</span></span>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1"><Info className="w-4 h-4 text-orange-600" /></div>
                 <p className="text-xs font-medium text-gray-400 leading-normal">
                    <span className="font-black text-white uppercase">Reason:</span> Highest pressure score detected on East approach combined with predicted influx from Hinjewadi Ph-1 office exits.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
