"use client";

import React from "react";
import { Users, AlertTriangle, Bike, Ban } from "lucide-react";

const tiles = [
  {
    title: "Mixed Traffic Composition",
    subtitle: "2-wheelers + Buses + Autos",
    icon: <Bike className="w-6 h-6" />,
    problem: "High variance in vehicle size and acceleration slows down traditional PCE models.",
    solution: "DRL adapts non-linear flow patterns, treating mixed density as a stochastic state rather than fixed occupancy."
  },
  {
    title: "Lane-less Behavior",
    subtitle: "Fluid lateral positioning",
    icon: <Users className="w-6 h-6" />,
    problem: "Vehicles stop 3-abreast in 2 lanes, making detector counts unreliable.",
    solution: "Image-based YOLO queue calculation provides ground-truth 'Pressure' regardless of lane discipline."
  },
  {
    title: "Pedestrian Interference",
    subtitle: "Sudden mid-block crossings",
    icon: <AlertTriangle className="w-6 h-6" />,
    problem: "Illegal crossings cause sudden discharge drops during green phases.",
    solution: "Real-time discharge rate monitoring triggers immediate green-split extension if flow is choked unexpectedly."
  },
  {
    title: "Parking Spillback",
    subtitle: "Illegal curb-side saturation",
    icon: <Ban className="w-6 h-6" />,
    problem: "Double parking reduces downstream capacity by 50% without warning.",
    solution: "Downstream-aware logic (Max-Pressure) prevents green phase actuation if downstream storage is saturated."
  }
];

export default function IndiaCentricAdaptation() {
  return (
    <div className="py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiles.map((tile, index) => (
          <div key={index} className="flex flex-col h-full bg-white border border-gray-100 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div className="p-3 bg-gray-50 rounded-md text-orange-600">
                {tile.icon}
              </div>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Case {index + 1}</span>
            </div>
            
            <div className="p-6 flex-1 space-y-6">
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-tight text-gray-900 mb-1">{tile.title}</h4>
                <p className="text-[11px] font-bold text-orange-500 uppercase tracking-widest">{tile.subtitle}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">The Problem</span>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                    "{tile.problem}"
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md border-l-4 border-orange-600">
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-1">Hybrid Solution</span>
                  <p className="text-xs text-gray-950 font-bold leading-relaxed">
                    {tile.solution}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
