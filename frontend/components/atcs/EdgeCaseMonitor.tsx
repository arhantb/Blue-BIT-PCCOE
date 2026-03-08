"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, Ambulance, Info } from "lucide-react";

export default function EdgeCaseMonitor() {
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm h-full">
      <div className="flex items-center gap-3 mb-8">
        <AlertTriangle className="w-5 h-5 text-gray-900" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Edge Case Monitor</h3>
      </div>

      <div className="space-y-4">
        <AlertCard 
          icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
          label="Downstream Congestion"
          status="Rising (Wakad Junction)"
          type="warning"
        />
        <AlertCard 
          icon={<ShieldCheck className="w-4 h-4 text-green-500" />}
          label="Spillback Prevention"
          status="Active"
          type="stable"
        />
        <AlertCard 
          icon={<Ambulance className="w-4 h-4 text-gray-300" />}
          label="Emergency Detection"
          status="Inactive"
          type="neutral"
        />

        <div className="mt-6 p-4 bg-gray-50 rounded-sm border-l-2 border-gray-200 flex items-start gap-3">
           <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
           <p className="text-[10px] font-bold text-gray-500 uppercase leading-normal tracking-tight">
             Failsafe protocol: In case of telemetry loss, junction reverts to Edge-stored Max-Pressure baseline.
           </p>
        </div>
      </div>
    </div>
  );
}

function AlertCard({ icon, label, status, type }: { icon: React.ReactNode; label: string; status: string; type: 'warning' | 'stable' | 'neutral' }) {
  return (
    <div className={`flex items-center justify-between p-4 border rounded-sm transition-all ${
      type === 'warning' ? 'bg-orange-50/50 border-orange-100' : 
      type === 'stable' ? 'bg-green-50/50 border-green-100' : 
      'bg-gray-50/50 border-gray-100'
    }`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{label}</span>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${
        type === 'warning' ? 'text-orange-600' : 
        type === 'stable' ? 'text-green-600' : 
        'text-gray-400'
      }`}>
        {status}
      </span>
    </div>
  );
}
