"use client";

import React from "react";
import { TrafficLight } from "./TrafficLight";
import { Truck, Car, Bike } from "lucide-react";

interface IntersectionProps {
  name: string;
  phases: {
    NS: "red" | "yellow" | "green";
    WE: "red" | "yellow" | "green";
  };
  timers: {
    NS: number;
    WE: number;
  };
  queues: {
    north: any;
    south: any;
    east: any;
    west: any;
  };
}

export const Intersection: React.FC<IntersectionProps> = ({
  name,
  phases,
  timers,
  queues,
}) => {
  return (
    <div className="relative w-[850px] h-[850px] flex items-center justify-center shrink-0">
      {/* Background - Clean Pavement */}
      <div className="absolute inset-0 bg-gray-50 rounded-[6rem] shadow-inner border-[12px] border-white" />
      
      {/* Roads */}
      <div className="absolute w-52 h-full bg-[#34495e] border-x-8 border-white/20 shadow-2xl" /> 
      <div className="absolute h-52 w-full bg-[#34495e] border-y-8 border-white/20 shadow-2xl" /> 

      {/* Zebra Crossings */}
      <Zebra pos="top" />
      <Zebra pos="bottom" />
      <Zebra pos="left" />
      <Zebra pos="right" />

      {/* Junction Center */}
      <div className="absolute w-52 h-52 bg-white/10 backdrop-blur-[6px] border-4 border-white/20 flex flex-col items-center justify-center z-10 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
         <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] mb-1">Adaptive Control</span>
         <span className="text-xl font-black text-white uppercase tracking-tight text-center px-6 leading-tight drop-shadow-md">
           {name}
         </span>
      </div>

      {/* Traffic Lights */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40">
        <TrafficLight state={phases.NS} timer={timers.NS} />
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 rotate-180 z-40">
        <div className="rotate-180">
          <TrafficLight state={phases.NS} timer={timers.NS} />
        </div>
      </div>
      <div className="absolute left-12 top-1/2 -translate-y-1/2 -rotate-90 z-40">
        <div className="rotate-90">
          <TrafficLight state={phases.WE} timer={timers.WE} />
        </div>
      </div>
      <div className="absolute right-12 top-1/2 -translate-y-1/2 rotate-90 z-40">
        <div className="-rotate-90">
          <TrafficLight state={phases.WE} timer={timers.WE} />
        </div>
      </div>

      {/* Upgraded Sensor Tags */}
      <SensorTag pos="top" label="NC" data={queues.north} />
      <SensorTag pos="bottom" label="SC" data={queues.south} />
      <SensorTag pos="left" label="WC" data={queues.west} />
      <SensorTag pos="right" label="EC" data={queues.east} />
    </div>
  );
};

const Zebra = ({ pos }: { pos: string }) => {
  const styles: any = {
    top: "top-[150px] left-1/2 -translate-x-1/2 w-52 h-16 flex justify-around",
    bottom: "bottom-[150px] left-1/2 -translate-x-1/2 w-52 h-16 flex justify-around",
    left: "left-[150px] top-1/2 -translate-y-1/2 w-16 h-52 flex flex-col justify-around",
    right: "right-[150px] top-1/2 -translate-y-1/2 w-16 h-52 flex flex-col justify-around",
  };
  const isVertical = pos === "left" || pos === "right";
  return (
    <div className={`absolute ${styles[pos]} opacity-60 z-10`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${isVertical ? "h-2 w-full" : "w-2 h-full"} bg-white`} />
      ))}
    </div>
  );
};

const SensorTag = ({ pos, label, data }: any) => {
  const positions: any = {
    top: "top-40 left-1/2 -translate-x-1/2",
    bottom: "bottom-40 left-1/2 -translate-x-1/2",
    left: "left-40 top-1/2 -translate-y-1/2",
    right: "right-40 top-1/2 -translate-y-1/2",
  };

  const isHeavy = data.density > 70;

  return (
    <div className={`absolute ${positions[pos]} bg-white border border-gray-100 p-4 rounded-3xl shadow-2xl z-20 w-44 border-l-4 ${isHeavy ? 'border-l-red-500' : 'border-l-orange-500'}`}>
       <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label} FIELD SENSOR</span>
          <div className={`w-2 h-2 rounded-full ${isHeavy ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
       </div>
       
       <div className="space-y-2">
          <div className="flex justify-between items-end">
             <span className="text-[9px] font-bold text-gray-400 uppercase">Queue Len</span>
             <span className="text-sm font-black text-gray-900 leading-none">{data.queueLen}m</span>
          </div>
          <div className="flex justify-between items-end">
             <span className="text-[9px] font-bold text-gray-400 uppercase">Density</span>
             <span className={`text-sm font-black leading-none ${isHeavy ? 'text-red-600' : 'text-orange-600'}`}>{data.density}%</span>
          </div>
          
          <div className="h-px bg-gray-50 my-2" />
          
          <div className="flex items-center justify-between px-1 text-gray-400">
             <div className="flex items-center gap-1">
                <Truck className="w-3 h-3" /> <span className="text-[10px] font-black text-gray-800">{data.mix.trucks}</span>
             </div>
             <div className="flex items-center gap-1">
                <Car className="w-3 h-3" /> <span className="text-[10px] font-black text-gray-800">{data.mix.cars}</span>
             </div>
             <div className="flex items-center gap-1">
                <Bike className="w-3 h-3" /> <span className="text-[10px] font-black text-gray-800">{data.mix.bikes}</span>
             </div>
          </div>
       </div>
    </div>
  );
};
