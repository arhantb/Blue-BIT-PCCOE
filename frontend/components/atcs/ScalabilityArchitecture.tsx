"use client";

import React from "react";
import { Cpu, Server, Network, Boxes, Layers, CheckCircle2 } from "lucide-react";

export default function ScalabilityArchitecture() {
  return (
    <div className="py-12">
      <div className="bg-gray-50 rounded-md border border-gray-100 p-12 overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Network className="w-96 h-96" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
            
            {/* Edge Level */}
            <div className="flex flex-col items-center text-center space-y-4 max-w-[240px]">
               <div className="w-20 h-20 bg-white shadow-md rounded-md flex items-center justify-center border-b-4 border-orange-500">
                  <Cpu className="w-10 h-10 text-orange-600" />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">Edge Device</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Raspberry Pi / Jetson</p>
               </div>
               <p className="text-[11px] font-medium text-gray-600 leading-relaxed italic">
                  "Runs lightweight YOLO and Max-Pressure baseline locally."
               </p>
            </div>

            <div className="hidden md:block w-px h-24 bg-gray-200" />
            <div className="md:hidden w-24 h-px bg-gray-200" />

            {/* Junction Level */}
            <div className="flex flex-col items-center text-center space-y-4 max-w-[240px]">
               <div className="w-24 h-24 bg-white shadow-lg rounded-md flex items-center justify-center border-b-4 border-gray-900 relative">
                  <Server className="w-12 h-12 text-gray-900" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                     1
                  </div>
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">Intersection Controller</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Local ICCC Node</p>
               </div>
               <p className="text-[11px] font-medium text-gray-600 leading-relaxed italic">
                  "Recursive State Estimation and DRL Phase Selection."
               </p>
            </div>

            <div className="hidden md:block w-px h-24 bg-gray-200" />
            <div className="md:hidden w-24 h-px bg-gray-200" />

            {/* Corridor Level */}
            <div className="flex flex-col items-center text-center space-y-4 max-w-[240px]">
               <div className="w-28 h-28 bg-gray-900 shadow-2xl rounded-md flex items-center justify-center border-b-4 border-orange-600">
                  <Layers className="w-14 h-14 text-white" />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-gray-900">Corridor Coordination</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MARL Synchronization</p>
               </div>
               <p className="text-[11px] font-medium text-gray-600 leading-relaxed italic">
                  "Multi-Agent RL for corridor green-waves and offsets."
               </p>
            </div>

          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-200 pt-12">
             {[
               { label: "Edge Deployable", desc: "No massive server rack needed" },
               { label: "Low Infra Requirement", desc: "Works with existing cameras" },
               { label: "Data Agnostic", desc: "Plugs into any sensor API" },
               { label: "Scalable", desc: "One junction to entire corridor" }
             ].map((prop, i) => (
               <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-green-500" />
                     <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">{prop.label}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight ml-6 italic">{prop.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
