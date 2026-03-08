"use client";

import React from "react";
import { Megaphone, ShieldAlert, ChevronRight } from "lucide-react";

interface Props {
  advisories: string[];
}

export default function AdvisoryPanel({ advisories }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
       <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-orange-600" />
            Public Outreach & Advisories
          </h3>
          <span className="text-[9px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
             Broadcasting
          </span>
       </div>

       <div className="p-6 space-y-3">
          {advisories.map((advisory, idx) => (
            <div key={idx} className="group cursor-pointer hover:bg-orange-50 transition-colors bg-white border border-gray-100 p-4 rounded-sm flex items-start gap-4 shadow-sm hover:shadow-md hover:border-orange-200">
               <div className="p-2 bg-orange-600 text-white rounded-sm shrink-0 transition-transform group-hover:scale-110">
                  <ShieldAlert className="w-3 h-3" />
               </div>
               <div className="flex-1 flex justify-between items-center">
                  <p className="text-xs font-bold text-gray-700 leading-normal pr-4">
                     {advisory}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
               </div>
            </div>
          ))}
       </div>

       <div className="mt-auto p-4 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Target Platforms</span>
          <div className="flex gap-4">
             <span className="text-[9px] font-black text-gray-600 uppercase">Hoppr API</span>
             <span className="text-[9px] font-black text-gray-600 uppercase">Twitter/X</span>
             <span className="text-[9px] font-black text-gray-600 uppercase">Variable Msg Signage</span>
          </div>
       </div>
    </div>
  );
}
