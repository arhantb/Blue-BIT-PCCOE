"use client";

import React from "react";
import { Ambulance, AlertCircle, VolumeX, ShieldCheck, Zap, Activity, Info } from "lucide-react";

const cases = [
  {
    title: "Ambulance Detection",
    subtitle: "Immediate Override",
    icon: <Ambulance className="w-6 h-6" />,
    logic: "GPS + AI Visual trigger.",
    action: "Immediate phase termination & corridor green-wave synchronization.",
    impact: "Impact: Zero-delay emergency transit."
  },
  {
    title: "Downstream Spillback",
    subtitle: "Upstream Throttling",
    icon: <AlertCircle className="w-6 h-6" />,
    logic: "Occupancy > 90% at downstream exit.",
    action: "Gating upstream inflow to prevent junction gridlock.",
    impact: "Impact: Prevents total network collapse."
  },
  {
    title: "Sensor Noise",
    subtitle: "Kalman Smoothing",
    icon: <VolumeX className="w-6 h-6" />,
    logic: "Erroneous detection spikes.",
    action: "State estimation filters outliers using historical flow-density curves.",
    impact: "Impact: Stable signal splits despite sensor jitter."
  },
  {
    title: "Data Drop / Failure",
    subtitle: "Failsafe Baseline",
    icon: <ShieldCheck className="w-6 h-6" />,
    logic: "Complete telemetry loss.",
    action: "Immediate revert to calibrated Max-Pressure baseline (Edge-stored).",
    impact: "Impact: 100% uptime through local redundancy."
  }
];

export default function EdgeCaseHandling() {
  return (
    <div className="py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cases.map((item, index) => (
          <div key={index} className="bg-white border border-gray-100 rounded-md p-8 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-gray-50 rounded-md text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                {item.icon}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Failsafe Mode</span>
                <div className="flex gap-1">
                   <Zap className="w-3 h-3 text-orange-500 fill-orange-500" />
                   <Zap className="w-3 h-3 text-orange-100 fill-orange-100" />
                   <Zap className="w-3 h-3 text-orange-100 fill-orange-100" />
                </div>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-tight text-gray-900 mb-1">{item.title}</h4>
                <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest">{item.subtitle}</p>
              </div>
              
              <div className="bg-gray-50/50 p-4 rounded-md space-y-3 border border-gray-100/50">
                 <div className="flex items-start gap-3">
                    <div className="mt-1"><Info className="w-3 h-3 text-gray-400" /></div>
                    <p className="text-[11px] font-medium text-gray-600 leading-normal">
                       <span className="font-black text-gray-900 uppercase">Detection:</span> {item.logic}
                    </p>
                 </div>
                 <div className="flex items-start gap-3">
                    <div className="mt-1"><Activity className="w-3 h-3 text-orange-500" /></div>
                    <p className="text-[11px] font-black text-gray-900 leading-normal uppercase">
                       {item.action}
                    </p>
                 </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] font-black text-green-600 uppercase tracking-tighter flex items-center justify-between">
               {item.impact}
               <ShieldCheck className="w-4 h-4 opacity-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
