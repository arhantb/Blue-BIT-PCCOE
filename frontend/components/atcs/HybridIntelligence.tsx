"use client";

import React from "react";
import { Brain, ArrowRightLeft, Target, Cpu, Activity, Zap } from "lucide-react";

export default function HybridIntelligence() {
  return (
    <div className="py-12 flex flex-col lg:flex-row gap-0 border border-gray-100 rounded-md overflow-hidden bg-white shadow-sm">
      
      {/* Max-Pressure Side */}
      <div className="flex-1 p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gray-900 text-white rounded-md">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Max-Pressure Baseline</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network Stability Layer</p>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-md mb-8 border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculated Pressure (P<sub className="text-[8px]">i</sub>)</span>
             <div className="text-3xl font-black text-gray-900 tracking-tighter">
                Q<sub className="text-sm">up</sub> — Q<sub className="text-sm">down</sub>
             </div>
             <div className="w-24 h-1 bg-orange-600 rounded-full" />
             <p className="text-xs text-center text-gray-600 font-medium max-w-[240px]">
                Ensures local stability and provides critical protection against downstream spillback.
             </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Core Logic</h4>
          <div className="grid grid-cols-1 gap-3">
            {[
              "Throughput Maximization",
              "Saturation Flow Balancing",
              "Gridlock Prevention"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />
                <span className="text-xs font-bold text-gray-700 uppercase">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DRL Side */}
      <div className="flex-1 p-10 bg-gray-50/30">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-orange-600 text-white rounded-md shadow-lg shadow-orange-100">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">DRL Optimization Layer</h3>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Deep Reinforcement Learning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm space-y-3">
            <div className="text-orange-600"><Target className="w-5 h-5" /></div>
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">State</h5>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">Queues, Predicted Inflow, Downstream Capacity</p>
          </div>
          <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm space-y-3">
            <div className="text-orange-600"><Cpu className="w-5 h-5" /></div>
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Action</h5>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">Phase Selection, Green Splits, Cycle Length</p>
          </div>
          <div className="bg-white p-6 rounded-md border border-gray-100 shadow-sm space-y-3">
            <div className="text-orange-600"><Zap className="w-5 h-5" /></div>
            <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Reward</h5>
            <p className="text-[11px] font-bold text-gray-900 leading-tight">Minimize Delay, No Spillbacks, Max Throughput</p>
          </div>
        </div>

        <div className="bg-orange-600 p-8 rounded-md text-white">
          <h4 className="text-[11px] font-black uppercase tracking-widest mb-4 opacity-80">Hybrid Integration</h4>
          <p className="text-sm font-medium leading-relaxed mb-4">
            DRL explores optimal phase sequences while Max-Pressure acts as a <span className="font-black text-white underline decoration-white/30 underline-offset-4">Safety Filter</span>, overriding decisions that would lead to network collapse.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
               Real-time Adaptivity
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/50" />
               Safe Exploration
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
