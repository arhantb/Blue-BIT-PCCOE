"use client";

import React from "react";
import { AlertCircle, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { ATCSDecisionSchema } from "@/types/atcs";

interface Props {
  risk: ATCSDecisionSchema["output"]["risk_assessment"];
}

export default function RiskAssessmentPanel({ risk }: Props) {
  const getRingColor = (val: number) => {
    if (val > 80) return "text-red-500";
    if (val > 50) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className="bg-white border border-gray-100 rounded-sm shadow-sm flex flex-col h-full overflow-hidden">
       <div className="bg-gray-50 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Vulnerability Metrics
          </h3>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Statistical Risk</span>
       </div>

       <div className="p-6 grid grid-cols-2 gap-8">
          {/* Choke Probability */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
             <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90">
                   <circle
                      cx="40" cy="40" r="36"
                      stroke="currentColor" strokeWidth="6"
                      fill="transparent" className="text-gray-100"
                   />
                   <circle
                      cx="40" cy="40" r="36"
                      stroke="currentColor" strokeWidth="6"
                      fill="transparent" strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - risk.choke_probability / 100)}`}
                      className={getRingColor(risk.choke_probability)}
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-xl font-black text-gray-900 tracking-tighter">{risk.choke_probability}%</span>
                </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Choke Probability</span>
                <span className="text-[9px] font-bold text-gray-500 uppercase leading-tight">University corridor spillback risk</span>
             </div>
          </div>

          {/* Crash Risk */}
          <div className="flex flex-col items-center justify-center text-center space-y-3">
             <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90">
                   <circle
                      cx="40" cy="40" r="36"
                      stroke="currentColor" strokeWidth="6"
                      fill="transparent" className="text-gray-100"
                   />
                   <circle
                      cx="40" cy="40" r="36"
                      stroke="currentColor" strokeWidth="6"
                      fill="transparent" strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - risk.crash_risk / 100)}`}
                      className={getRingColor(risk.crash_risk)}
                   />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-xl font-black text-gray-900 tracking-tighter">{risk.crash_risk}%</span>
                </div>
             </div>
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Incident Index</span>
                <span className="text-[9px] font-bold text-gray-500 uppercase leading-tight">Combined risk based on density</span>
             </div>
          </div>
       </div>

       <div className="p-6 pt-0 mt-auto">
          <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-sm border border-gray-200">
                   <Users className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pedestrian Density</span>
                   <span className="text-xs font-black text-gray-900 uppercase">{risk.pedestrian_density}</span>
                </div>
             </div>
             <div className="flex flex-col items-end">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Increasing</span>
             </div>
          </div>
       </div>
    </div>
  );
}
