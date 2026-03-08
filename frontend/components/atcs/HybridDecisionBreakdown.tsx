"use client";

import React from "react";
import { Brain, ArrowRightLeft, Cpu, Table as TableIcon } from "lucide-react";

const logicData = [
  { approach: "East", maxP: 14, drl: "+5s", final: "45s", color: "bg-orange-600" },
  { approach: "North", maxP: 6, drl: "-2s", final: "28s", color: "bg-gray-400" },
  { approach: "South", maxP: 3, drl: "-5s", final: "25s", color: "bg-gray-300" },
  { approach: "West", maxP: 8, drl: "+4s", final: "34s", color: "bg-gray-500" },
];

export default function HybridDecisionBreakdown() {
  return (
    <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm h-full">
      <div className="flex items-center gap-3 mb-8">
        <Brain className="w-5 h-5 text-gray-900" />
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Hybrid Decision Breakdown</h3>
      </div>

      <div className="space-y-8">
        {/* Table View */}
        <div className="overflow-hidden border border-gray-100 rounded-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Approach</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Max-Pressure</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">DRL Adj.</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Final Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logicData.map((row) => (
                <tr key={row.approach} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${row.color}`} />
                    <span className="text-xs font-black text-gray-900 uppercase">{row.approach}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-gray-900">{row.maxP}</td>
                  <td className={`px-4 py-3 text-xs font-black ${row.drl.startsWith("+") ? "text-orange-600" : "text-gray-400"}`}>{row.drl}</td>
                  <td className="px-4 py-3 text-sm font-black text-gray-950">{row.final}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Logic Explained Panel */}
        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-gray-50 rounded-sm space-y-2">
              <div className="flex items-center gap-2 opacity-50">
                 <ArrowRightLeft className="w-3 h-3 text-gray-900" />
                 <span className="text-[9px] font-black uppercase tracking-widest leading-none">Stability Check</span>
              </div>
              <p className="text-[10px] font-bold text-gray-600 uppercase leading-normal">
                 Max-Pressure ensures throughput stability and spillback prevention across the network.
              </p>
           </div>
           <div className="p-4 bg-orange-50/50 rounded-sm space-y-2 border border-orange-100/50">
              <div className="flex items-center gap-2 opacity-80">
                 <Cpu className="w-3 h-3 text-orange-600" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-orange-600 leading-none">DRL Optimizer</span>
              </div>
              <p className="text-[10px] font-black text-gray-900 uppercase leading-normal">
                 Deep RL adjusts green splits based on non-linear predicted demand surges.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
