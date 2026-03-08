"use client";

import React from "react";
import { Activity, ShieldCheck, Clock, RefreshCcw, Gauge } from "lucide-react";

export default function TopStatusBar() {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between text-white overflow-x-auto gap-8">
      {/* Location & Title */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Corridor</span>
          <span className="text-sm font-black text-orange-500 tracking-tight">HINJEWADI WAKAD CORRIDOR</span>
        </div>
        <div className="h-6 w-px bg-gray-700" />
      </div>

      {/* Real-time Metrics */}
      <div className="flex items-center gap-10 shrink-0">
        <StatusItem label="Logic Mode" value="Hybrid (MaxP + DRL)" icon={<Activity className="w-3.5 h-3.5 text-orange-500" />} />
        <StatusItem label="Cycle Length" value="132s" icon={<Clock className="w-3.5 h-3.5 text-gray-400" />} />
        <StatusItem label="Offset Phase" value="14s" icon={<RefreshCcw className="w-3.5 h-3.5 text-gray-400" />} />
        <StatusItem label="Confidence" value="91%" icon={<Gauge className="w-3.5 h-3.5 text-green-500" />} />
      </div>

      {/* System Status */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-sm">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-green-500">System Stable</span>
        </div>
        <div className="text-[10px] font-mono text-gray-500">
           Uptime: 242d 14h 02m
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[100px]">
      <div className="flex items-center gap-1.5 opacity-60">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      </div>
      <span className="text-xs font-black tracking-tighter text-gray-100">{value}</span>
    </div>
  );
}
