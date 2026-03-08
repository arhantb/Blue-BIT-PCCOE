"use client";

import React from "react";
import { BrainCircuit, ShieldCheck, Clock, Zap, Target } from "lucide-react";
import { ATCSDecisionSchema } from "@/types/atcs";

interface Props {
  input: ATCSDecisionSchema["input"];
  output: ATCSDecisionSchema["output"];
}

export default function AIReasoningEngine({ input, output }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <BrainCircuit className="w-5 h-5 text-orange-600" />
            <div className="flex flex-col">
               <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 leading-none">Decision Intelligence Unit</h3>
               <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Core Reasoning Engine (Hybrid-MARL)</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${output.priority_level === 'high' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
               {output.priority_level} PRIORITY
            </span>
         </div>
      </div>

      <div className="p-6 flex-1 space-y-6">
         <div className="bg-orange-50 border-l-4 border-orange-500 p-4 relative">
            <Zap className="absolute top-2 right-2 w-4 h-4 text-orange-300" />
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block mb-2">Decision Summary</span>
            <p className="text-sm font-bold text-gray-900 leading-snug">
               {output.decision_summary}
            </p>
         </div>

         <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                     <Target className="w-3 h-3" /> Confidence Score
                  </span>
                  <div className="flex items-center gap-3">
                     <span className="text-2xl font-black text-gray-900 tracking-tighter">{output.confidence}%</span>
                     <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
               </div>
               <div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                     <Clock className="w-3 h-3" /> Refresh Interval
                  </span>
                  <span className="text-xl font-black text-orange-600 tracking-tighter">T-minus {output.next_review_in_minutes}m</span>
               </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-sm border border-gray-100">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-3">Predicted Surge Window</span>
               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-gray-900 uppercase">{input.traffic_prediction.peak_period.label}</span>
                     <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-sm">Active</span>
                  </div>
                  <div className="text-lg font-black text-gray-950 tracking-tighter">
                     {input.traffic_prediction.peak_period.start} - {input.traffic_prediction.peak_period.end}
                  </div>
                  <p className="text-[10px] font-medium text-gray-500 leading-tight">
                     {input.traffic_prediction.peak_period.description}
                  </p>
               </div>
            </div>
         </div>
      </div>

      <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex items-center justify-between">
         <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Deployment Logic</span>
         <code className="text-[9px] font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-sm shadow-sm">
            WAKAD-01_MARL_SURGE-DETECT_V3
         </code>
      </div>
    </div>
  );
}
