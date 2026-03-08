"use client";

import React from "react";
import { Zap, Info, ArrowRightLeft, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { ATCSDecisionSchema } from "@/types/atcs";

interface Props {
  actions: ATCSDecisionSchema["output"]["signal_actions"];
}

export default function SignalActionsPanel({ actions }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
       <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-600" />
            Signal Optimization Override
          </h3>
          <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-sm border border-green-100 uppercase">Synced</span>
       </div>

       <div className="p-6 space-y-8">
          {actions.map((action, idx) => (
            <div key={idx} className="space-y-4">
               <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Target Junction Area</span>
                     <span className="text-lg font-black text-gray-950 uppercase tracking-tighter">{action.junction_area}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-sm border border-orange-100">
                     <Info className="w-3.5 h-3.5" /> {action.reason}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span className="flex items-center gap-2 font-black text-gray-950">
                           <ArrowRightLeft className="w-3.5 h-3.5 text-orange-600" /> E-W Corridor
                        </span>
                        <span className="text-xl font-black text-gray-950">{action.east_west_green_time_sec}s</span>
                     </div>
                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(action.east_west_green_time_sec / (action.east_west_green_time_sec + action.north_south_green_time_sec)) * 100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-orange-500"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <span className="flex items-center gap-2 font-black text-gray-950">
                           <ArrowUpDown className="w-3.5 h-3.5 text-green-600" /> N-S Corridor
                        </span>
                        <span className="text-xl font-black text-gray-950">{action.north_south_green_time_sec}s</span>
                     </div>
                     <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(action.north_south_green_time_sec / (action.east_west_green_time_sec + action.north_south_green_time_sec)) * 100}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-green-500"
                        />
                     </div>
                  </div>
               </div>
            </div>
          ))}
       </div>

       <div className="mt-auto border-t border-gray-50 p-4 flex items-center justify-center gap-3 bg-gray-50/30">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-orange-500" />
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">EW Primary</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500" />
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">NS Priority</span>
          </div>
       </div>
    </div>
  );
}
