"use client";

import React from "react";
import { MapPin, Activity, TrendingUp, ShieldCheck } from "lucide-react";

interface ZoneStatusProps {
  outflow: number;
  confidence: number;
  isPredictive: boolean;
}

export const ZoneStatus: React.FC<ZoneStatusProps> = ({
  outflow,
  confidence,
  isPredictive,
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-2xl">
            <MapPin className="text-orange-600 w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">Hinjewadi IT Park</h2>
            <p className="text-gray-500 font-medium">Phase 1 • Shivaji Chowk Corridor</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Vehicle Outflow
            </span>
            <span className="text-xl font-bold text-black">{outflow} vph</span>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Confidence
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-green-600">{confidence}%</span>
            </div>
          </div>

          <div className="flex flex-col col-span-2 md:col-span-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Mode
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block w-fit ${
              isPredictive 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}>
              {isPredictive ? "PREDICTIVE (PUNE-ATCS)" : "NORMAL MODE"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
