"use client";

import React from "react";
import { ClipboardList, CheckCircle2, MoreHorizontal } from "lucide-react";

interface Props {
  actions: string[];
}

export default function TrafficManagementPanel({ actions }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
       <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-600" />
            Traffic Management Directives
          </h3>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">On-Ground Action</span>
       </div>

       <div className="p-6 space-y-4">
          {actions.map((action, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-gray-50/50 p-4 border border-gray-100/50 rounded-sm hover:border-orange-200 transition-colors cursor-default group">
               <div className="relative">
                  <CheckCircle2 className="w-5 h-5 text-green-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[8px] font-black text-gray-400 group-hover:hidden transition-all">{idx + 1}</span>
                  </div>
               </div>
               <span className="text-xs font-black text-gray-900 tracking-tight">{action}</span>
            </div>
          ))}
       </div>

       <div className="mt-auto p-4 border-t border-gray-50 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
          <span>Manual Override Log</span>
          <MoreHorizontal className="w-4 h-4 text-gray-300 pointer-events-none" />
       </div>
    </div>
  );
}
