"use client";

import React, { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { Intersection } from "./Intersection";
import { Vehicle as VehicleComp } from "./Vehicle";

// --- Parameters & Weights ---
const YELLOW_TIME = 3;
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 2000;
const JUNCTION_X = CANVAS_WIDTH / 2;
const JUNCTION_Y = CANVAS_HEIGHT / 2;
const SMOOTHING_FRICTION = 0.08;

const V_WEIGHTS = {
  truck: 3.0,
  car: 1.0,
  bike: 0.3
};

const V_SIZES = {
  truck: { w: 48, h: 22 },
  car: { w: 32, h: 16 },
  bike: { w: 20, h: 10 }
};

interface VehicleEntity {
  id: number;
  type: "truck" | "car" | "bike";
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  direction: "EB" | "WB" | "NB" | "SB";
  color: string;
}

interface DirectionMetrics {
  raw: number;
  filtered: number;
  queueLen: number;
  density: number;
  mix: { trucks: number; cars: number; bikes: number };
}

interface SignalGroup {
  name: string;
  phase: "NS" | "WE";
  state: "red" | "yellow" | "green";
  timer: number;
  nsGreenSplit: number;
  weGreenSplit: number;
  cycleLength: number;
  queues: {
    north: DirectionMetrics;
    south: DirectionMetrics;
    east: DirectionMetrics;
    west: DirectionMetrics;
  };
}

interface SimulationEngineProps {
  isPredictive: boolean;
  surgeLevel: number;
  simSpeed: number;
  onMetricsUpdate: (metrics: any) => void;
  onNarrativeUpdate: (event: string) => void;
}

export const SimulationEngine = forwardRef((props: SimulationEngineProps, ref) => {
  const { isPredictive, surgeLevel, simSpeed, onMetricsUpdate, onNarrativeUpdate } = props;

  const defaultMetrics = (): DirectionMetrics => ({
    raw: 0, filtered: 0, queueLen: 0, density: 0,
    mix: { trucks: 0, cars: 0, bikes: 0 }
  });

  const [uiSignal, setUiSignal] = useState<SignalGroup>({
    name: "Hinjewadi Phase 1",
    phase: "WE", state: "green", timer: 30, nsGreenSplit: 30, weGreenSplit: 30, cycleLength: 66,
    queues: {
      north: defaultMetrics(), south: defaultMetrics(),
      east: defaultMetrics(), west: defaultMetrics()
    }
  });
  
  const [uiVehicles, setUiVehicles] = useState<VehicleEntity[]>([]);

  // Refs for Physics Loop
  const vehiclesRef = useRef<VehicleEntity[]>([]);
  const signalRef = useRef<SignalGroup>({...uiSignal});
  const lastTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number>(0);
  const totalTimeRef = useRef<number>(0);
  const operationalTimerRef = useRef<number>(0);

  const updateSimulation = useCallback((time: number) => {
    const deltaTime = ((time - lastTimeRef.current) / 1000) * simSpeed;
    lastTimeRef.current = time;

    totalTimeRef.current += deltaTime;
    operationalTimerRef.current += deltaTime;

    // 1. Operational Loop (Weight-Based Logic entry)
    if (operationalTimerRef.current >= 10) {
      operationalTimerRef.current = 0;
      
      const computeDirectional = (dir: "EB" | "WB" | "NB" | "SB", sig: SignalGroup) => {
        const vehicles = vehiclesRef.current.filter(v => v.direction === dir);
        let weightedSum = 0;
        let maxDist = 0;
        const mix = { trucks: 0, cars: 0, bikes: 0 };

        vehicles.forEach(v => {
          let dist = 0;
          if (dir === "EB") { dist = JUNCTION_X - v.x; if (dist > 0 && dist < 450) { weightedSum += V_WEIGHTS[v.type]; maxDist = Math.max(maxDist, dist - 60); mix[v.type === "truck" ? "trucks" : v.type === "car" ? "cars" : "bikes"]++; } }
          else if (dir === "WB") { dist = v.x - JUNCTION_X; if (dist > 0 && dist < 450) { weightedSum += V_WEIGHTS[v.type]; maxDist = Math.max(maxDist, dist - 60); mix[v.type === "truck" ? "trucks" : v.type === "car" ? "cars" : "bikes"]++; } }
          else if (dir === "SB") { dist = JUNCTION_Y - v.y; if (dist > 0 && dist < 450) { weightedSum += V_WEIGHTS[v.type]; maxDist = Math.max(maxDist, dist - 60); mix[v.type === "truck" ? "trucks" : v.type === "car" ? "cars" : "bikes"]++; } }
          else if (dir === "NB") { dist = v.y - JUNCTION_Y; if (dist > 0 && dist < 450) { weightedSum += V_WEIGHTS[v.type]; maxDist = Math.max(maxDist, dist - 60); mix[v.type === "truck" ? "trucks" : v.type === "car" ? "cars" : "bikes"]++; } }
        });

        const k = 0.35;
        const prevFiltered = (sig.queues as any)[dir === "EB" ? "west" : dir === "WB" ? "east" : dir === "NB" ? "south" : "north"].filtered;
        const filtered = prevFiltered + k * (weightedSum - prevFiltered);
        
        return {
          raw: Math.round(weightedSum),
          filtered: Math.round(filtered),
          queueLen: Math.round(maxDist),
          density: Math.min(100, Math.round((weightedSum / 40) * 100)),
          mix
        };
      };

      const nMetrics = computeDirectional("SB", signalRef.current);
      const sMetrics = computeDirectional("NB", signalRef.current);
      const eMetrics = computeDirectional("WB", signalRef.current);
      const wMetrics = computeDirectional("EB", signalRef.current);

      // Adaptive Split logic with Weights
      const nsDemand = nMetrics.filtered + sMetrics.filtered + (surgeLevel * 20);
      const weDemand = wMetrics.filtered + eMetrics.filtered + (isPredictive ? 35 : 0);
      const totalDemand = Math.max(1, nsDemand + weDemand);
      
      const availableGreen = signalRef.current.cycleLength - (2 * YELLOW_TIME);
      let weSplit = (weDemand / totalDemand) * availableGreen;
      let nsSplit = availableGreen - weSplit;

      if (weSplit < 10) { weSplit = 10; nsSplit = availableGreen - 10; }
      if (nsSplit < 10) { nsSplit = 10; weSplit = availableGreen - 10; }

      if (!isPredictive) { weSplit = 30; nsSplit = 30; }

      signalRef.current = {
        ...signalRef.current,
        weGreenSplit: weSplit,
        nsGreenSplit: nsSplit,
        queues: {
          north: nMetrics, south: sMetrics, east: eMetrics, west: wMetrics
        }
      };

      const highTrucks = [nMetrics, sMetrics, eMetrics, wMetrics].some(m => m.mix.trucks > 2);
      onNarrativeUpdate(`[ SENSOR ANALYSIS ] ${highTrucks ? "Heavy load (Trucks) detected." : "Standard vehicle mix."} Calculated Queue: ${Math.max(nMetrics.queueLen, sMetrics.queueLen, eMetrics.queueLen, wMetrics.queueLen)}m.`);
      
      onMetricsUpdate({
        delay: isPredictive ? 14 + (surgeLevel * 6) : 32 + (surgeLevel * 12),
        throughput: isPredictive ? 1900 + (surgeLevel * 500) : 1250,
        confidence: 95 + Math.random() * 3,
        priority: weDemand > nsDemand ? "East-West" : "North-South",
        topSurge: Math.max(nMetrics.density, sMetrics.density, eMetrics.density, wMetrics.density)
      });
    }

    // 2. Signal Phase logic (Same - Smooth)
    const sig = signalRef.current;
    const localTime = totalTimeRef.current % sig.cycleLength;
    let state: SignalGroup["state"] = "red";
    let phase: SignalGroup["phase"] = "NS";
    let timer = 0;

    if (localTime < sig.weGreenSplit) {
      phase = "WE";
      if (localTime < sig.weGreenSplit - YELLOW_TIME) {
        state = "green"; timer = Math.ceil(sig.weGreenSplit - YELLOW_TIME - localTime);
      } else {
        state = "yellow"; timer = Math.ceil(sig.weGreenSplit - localTime);
      }
    } else {
      phase = "NS";
      const nsTime = localTime - sig.weGreenSplit;
      if (nsTime < sig.nsGreenSplit - YELLOW_TIME) {
        state = "green"; timer = Math.ceil(sig.nsGreenSplit - YELLOW_TIME - nsTime);
      } else {
        state = "yellow"; timer = Math.ceil(sig.nsGreenSplit - nsTime);
      }
    }
    signalRef.current = { ...sig, state, phase, timer };

    // 3. Physics & Law Adherence
    let activeVehicles = vehiclesRef.current.filter(v => 
      v.x > -100 && v.x < CANVAS_WIDTH + 100 && v.y > -100 && v.y < CANVAS_HEIGHT + 100
    );

    activeVehicles = activeVehicles.map(v => {
      let targetSpeed = v.type === "truck" ? 2.0 : v.type === "car" ? 2.8 : 3.2; 
      
      // Stop line logic
      const approachDist = 140;
      const stopDist = 60;

      if (v.direction === "EB") {
        const d = JUNCTION_X - v.x;
        if (d > stopDist && d < approachDist) {
           if (signalRef.current.phase === "NS" || signalRef.current.state !== "green") targetSpeed = 0;
        }
      } else if (v.direction === "WB") {
        const d = v.x - JUNCTION_X;
        if (d > stopDist && d < approachDist) {
           if (signalRef.current.phase === "NS" || signalRef.current.state !== "green") targetSpeed = 0;
        }
      } else if (v.direction === "SB") {
        const d = JUNCTION_Y - v.y;
        if (d > stopDist && d < approachDist) {
           if (signalRef.current.phase === "WE" || signalRef.current.state !== "green") targetSpeed = 0;
        }
      } else if (v.direction === "NB") {
        const d = v.y - JUNCTION_Y;
        if (d > stopDist && d < approachDist) {
           if (signalRef.current.phase === "WE" || signalRef.current.state !== "green") targetSpeed = 0;
        }
      }

      // Car following (Density-Aware)
      activeVehicles.forEach(other => {
        if (other.id === v.id || other.direction !== v.direction) return;
        let d = 0;
        if (v.direction === "EB") d = other.x - v.x;
        else if (v.direction === "WB") d = v.x - other.x;
        else if (v.direction === "SB") d = other.y - v.y;
        else if (v.direction === "NB") d = v.y - other.y;

        const safeDist = v.type === "truck" ? 140 : 100;
        const crashDist = v.type === "truck" ? 80 : 65;

        if (d > 0 && d < safeDist) targetSpeed = Math.min(targetSpeed, Math.abs(v.direction.includes('B') ? other.vx : other.vy) * 0.9);
        if (d > 0 && d < crashDist) targetSpeed = 0;
      });

      // Physics Integration
      let nx = v.x; let ny = v.y; let nvx = v.vx; let nvy = v.vy;
      const friction = SMOOTHING_FRICTION;

      if (v.direction === "EB") {
        nvx += (targetSpeed - nvx) * friction;
        nx += nvx * 150 * deltaTime;
      } else if (v.direction === "WB") {
        nvx += (-targetSpeed - nvx) * friction;
        nx += nvx * 150 * deltaTime;
      } else if (v.direction === "SB") {
        nvy += (targetSpeed - nvy) * friction;
        ny += nvy * 150 * deltaTime;
      } else if (v.direction === "NB") {
        nvy += (-targetSpeed - nvy) * friction;
        ny += nvy * 150 * deltaTime;
      }

      return { ...v, x: nx, y: ny, vx: nvx, vy: nvy };
    });

    // 4. Spawning (Multi-Type)
    const spawnChance = (0.015 + (surgeLevel * 0.05)) * simSpeed;
    if (Math.random() < spawnChance) {
      const dirs: ("EB" | "WB" | "NB" | "SB")[] = ["EB", "WB", "NB", "SB"];
      const dir = dirs[Math.floor(Math.random() * 4)];
      
      const typeRand = Math.random();
      const type: "truck" | "car" | "bike" = typeRand < 0.15 ? "truck" : typeRand < 0.7 ? "car" : "bike";
      
      let x = 0, y = 0, rot = 0;

      if (dir === "EB") { x = -50; y = JUNCTION_Y + 45; rot = 0; }
      else if (dir === "WB") { x = CANVAS_WIDTH + 50; y = JUNCTION_Y - 45; rot = 180; }
      else if (dir === "SB") { x = JUNCTION_X - 45; y = -50; rot = 90; }
      else if (dir === "NB") { x = JUNCTION_X + 45; y = CANVAS_HEIGHT + 50; rot = 270; }

      activeVehicles.push({
        id: Date.now() + Math.random(),
        type, x, y, vx: 0, vy: 0, rotation: rot, direction: dir,
        color: type === "truck" ? "bg-slate-700" : type === "car" ? "bg-orange-500" : "bg-green-600"
      });
    }

    vehiclesRef.current = activeVehicles;
    setUiSignal({...signalRef.current});
    setUiVehicles([...activeVehicles]);

    requestRef.current = requestAnimationFrame(updateSimulation);
  }, [simSpeed, isPredictive, surgeLevel, onMetricsUpdate, onNarrativeUpdate]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateSimulation);
    return () => cancelAnimationFrame(requestRef.current);
  }, [updateSimulation]);

  return (
    <div className="w-full h-full bg-[#ecf0f1] rounded-[4rem] border-[24px] border-white shadow-2xl relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#000 2px, transparent 2px)`, backgroundSize: '60px 60px' }} />
      
      <div className="relative">
         <Intersection 
            name={uiSignal.name}
            phases={{
              NS: uiSignal.phase === "NS" ? uiSignal.state : "red",
              WE: uiSignal.phase === "WE" ? uiSignal.state : "red",
            }}
            timers={{
              NS: uiSignal.phase === "NS" ? uiSignal.timer : 0,
              WE: uiSignal.phase === "WE" ? uiSignal.timer : 0
            }}
            queues={uiSignal.queues}
         />

         <div className="absolute inset-0 pointer-events-none overflow-visible">
           {uiVehicles.map(v => (
             <VehicleComp key={v.id} x={v.x - (CANVAS_WIDTH/2 - 425)} y={v.y - (CANVAS_HEIGHT/2 - 425)} rotation={v.rotation} color={v.color} type={v.type === "truck" ? "bus" : "car"} />
           ))}
         </div>
      </div>

      <div className="absolute bottom-16 right-16 flex flex-col gap-4">
         <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-gray-100 shadow-2xl space-y-4">
            <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Live Analysis
            </h5>
            <div className="space-y-2">
               <TeleItem label="Top Density" value={`${uiSignal.queues.east.density}%`} />
               <TeleItem label="Avg Queue" value={`${Math.round((uiSignal.queues.north.queueLen + uiSignal.queues.west.queueLen)/2)}m`} />
               <TeleItem label="Mix Mode" value="Dynamic Weighted" />
            </div>
         </div>
      </div>
    </div>
  );
});

const TeleItem = ({ label, value }: any) => (
  <div className="flex justify-between gap-12 border-b border-gray-50 pb-1">
     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{label}</span>
     <span className="text-[10px] font-black text-gray-800 uppercase">{value}</span>
  </div>
);

SimulationEngine.displayName = "SimulationEngine";
