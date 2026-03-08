"use client";

import React from "react";

interface TrafficLightProps {
  state: "red" | "yellow" | "green";
  orientation?: "horizontal" | "vertical";
  timer: number;
}

export const TrafficLight: React.FC<TrafficLightProps> = ({ 
  state, 
  orientation = "vertical",
  timer 
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`
        bg-gray-800 p-3 rounded-2xl shadow-xl border-[4px] border-gray-700 flex
        ${orientation === "vertical" ? "flex-col w-14 h-40" : "flex-row w-40 h-14"}
        gap-3 items-center justify-center relative
      `}>
        <div className={`w-8 h-8 rounded-full transition-all duration-300 ${
          state === "red" ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)]" : "bg-red-950/40"
        }`} />
        <div className={`w-8 h-8 rounded-full transition-all duration-300 ${
          state === "yellow" ? "bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.9)]" : "bg-yellow-900/40"
        }`} />
        <div className={`w-8 h-8 rounded-full transition-all duration-300 ${
          state === "green" ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.9)]" : "bg-green-950/40"
        }`} />
      </div>
      <div className="bg-white border-2 border-gray-100 shadow-md px-3 py-1 rounded-xl">
        <span className={`text-[12px] font-mono font-black ${
          state === "green" ? "text-green-600" : state === "red" ? "text-red-600" : "text-yellow-600"
        }`}>
          {timer.toString().padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};
