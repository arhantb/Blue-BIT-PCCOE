"use client";

import React from "react";

interface VehicleProps {
  x: number;
  y: number;
  rotation: number; // 0: East, 90: South, 180: West, 270: North
  color: string;
  type?: "car" | "bus" | "bike";
}

export const Vehicle: React.FC<VehicleProps> = ({ x, y, rotation, color, type = "car" }) => {
  const isBus = type === "bus";
  const width = isBus ? 48 : 32;
  const height = isBus ? 20 : 16;

  return (
    <div
      className={`absolute rounded-[4px] border border-black/10 shadow-xl ${color} transition-all duration-100 ease-linear transition-transform`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        zIndex: 50,
      }}
    >
      {/* Detail: Windshield (Oriented towards the front/right of the box) */}
      <div className="absolute right-1 top-1 bottom-1 w-2 bg-black/30 rounded-sm" />
      
      {/* Detail: Lights */}
      <div className="absolute right-0 top-1 w-1 h-1 bg-white/80 rounded-full" />
      <div className="absolute right-0 bottom-1 w-1 h-1 bg-white/80 rounded-full" />
      
      {/* Rear Lights */}
      <div className="absolute left-0 top-1 w-1 h-1 bg-red-600/60 rounded-full" />
      <div className="absolute left-0 bottom-1 w-1 h-1 bg-red-600/60 rounded-full" />

      {/* Roof detail */}
      <div className="absolute inset-2 border border-black/5 rounded-sm opacity-20" />
    </div>
  );
};
