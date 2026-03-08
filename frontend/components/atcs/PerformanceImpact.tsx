"use client";

import React from "react";
import { TrendingUp, Users, Clock, Zap } from "lucide-react";

export default function PerformanceImpact() {
  return (
    <div className="bg-gray-900 text-white p-8 rounded-sm shadow-xl h-full border-b-4 border-green-500">
      <div className="flex items-center gap-3 mb-10">
        <TrendingUp className="w-5 h-5 text-green-500" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">System Performance Impact</h3>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <MetricRow 
          label="Avg Junction Delay" 
          value="24s" 
          change="-32%" 
          sub="vs Fixed-Time Baseline"
          icon={<Clock className="w-5 h-5 text-green-500" />}
        />
        <MetricRow 
          label="Queue Length" 
          value="8.4m" 
          change="-18%" 
          sub="Network Mean Reduction"
          icon={<Users className="w-5 h-5 text-green-500" />}
        />
        <MetricRow 
          label="Vehicle Throughput" 
          value="1,420/h" 
          change="+12%" 
          sub="Junction Capacity Gain"
          icon={<Zap className="w-5 h-5 text-orange-500" />}
        />
      </div>

      <div className="mt-12 pt-8 border-t border-gray-800">
         <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mb-4 text-center">Verification Analytics</p>
         <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-[78%]" />
         </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, change, sub, icon }: { label: string; value: string; change: string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-800 rounded-sm group-hover:scale-110 transition-transform">
           {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{label}</span>
          <span className="text-2xl font-black text-white tracking-tighter">{value}</span>
        </div>
      </div>
      <div className="text-right">
         <span className={`text-lg font-black tracking-tighter block leading-none ${change.startsWith('-') ? 'text-green-500' : 'text-orange-500'}`}>
            {change}
         </span>
         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">{sub}</span>
      </div>
    </div>
  );
}
