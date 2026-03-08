"use client";

import React, { useState, useEffect, useRef } from "react";
import { TrafficLight } from "./TrafficLight";
import { Vehicle as VehicleComp } from "./Vehicle";

interface Signal {
  id: number;
  label: string;
  state: "red" | "yellow" | "green";
  x: number; // position in percentage
}

interface VehicleData {
  id: number;
  x: number;
  lane: number;
  speed: number;
  color: string;
}

interface SignalSimulationProps {
  isPredictive: boolean;
  surgeActive: boolean;
}

export const SignalSimulation: React.FC<SignalSimulationProps> = ({
  isPredictive,
  surgeActive,
}) => {
  const [signals, setSignals] = useState<Signal[]>([
    { id: 1, label: "L & T Ph-1", state: "red", x: 15 },
    { id: 2, label: "Cognizant", state: "red", x: 40 },
    { id: 3, label: "Wipro", state: "red", x: 65 },
    { id: 4, label: "Shivaji Chowk", state: "red", x: 90 },
  ]);

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const timerRef = useRef<number>(0);

  // Constants
  const SPAWN_RATE = surgeActive ? 0.05 : 0.02;
  const SIGNAL_CYCLE = 10000; // 10s total cycle
  const YELLOW_TIME = 2000;
  const GREEN_TIME = 4000;
  const OFFSET = isPredictive ? 1500 : 0; // ms offset per signal for green wave

  const vehicleColors = ["bg-orange-500", "bg-gray-800", "bg-blue-600", "bg-green-600"];

  const updateSimulation = (time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      timerRef.current += deltaTime;

      // Update Signal States
      setSignals((prev) =>
        prev.map((sig, idx) => {
          // Calculate signal phase based on its offset
          const signalOffset = idx * OFFSET;
          const adjustedTime = (timerRef.current + signalOffset) % SIGNAL_CYCLE;
          
          let state: "red" | "yellow" | "green" = "red";
          if (adjustedTime < GREEN_TIME) state = "green";
          else if (adjustedTime < GREEN_TIME + YELLOW_TIME) state = "yellow";
          
          return { ...sig, state };
        })
      );

      // Update Vehicles
      setVehicles((prev) => {
        // Filter out vehicles that went off-screen
        const active = prev.filter((v) => v.x < 110);

        // Move vehicles
        const moved = active.map((v) => {
          let canMove = true;
          
          // Check for red lights ahead
          signals.forEach((sig) => {
            if (sig.state === "red" || sig.state === "yellow") {
              const distToSignal = sig.x - v.x;
              if (distToSignal > 0 && distToSignal < 5) {
                canMove = false;
              }
            }
          });

          // Check for vehicles ahead (simple)
          active.forEach((other) => {
            if (other.id !== v.id && other.lane === v.lane) {
              const distToOther = other.x - v.x;
              if (distToOther > 0 && distToOther < 4) {
                canMove = false;
              }
            }
          });

          const currentSpeed = canMove ? v.speed : 0;
          return { ...v, x: v.x + currentSpeed * (deltaTime / 16) };
        });

        // Spawn new vehicle
        if (Math.random() < SPAWN_RATE) {
          const newVeh: VehicleData = {
            id: Date.now() + Math.random(),
            x: -5,
            lane: Math.floor(Math.random() * 2),
            speed: 0.15 + Math.random() * 0.1,
            color: vehicleColors[Math.floor(Math.random() * vehicleColors.length)],
          };
          return [...moved, newVeh];
        }

        return moved;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(updateSimulation);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateSimulation);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPredictive, surgeActive, signals]); // Re-bind when props change

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 mb-12">
      <div className="relative h-64 bg-gray-50 rounded-[40px] border-4 border-gray-100 overflow-hidden shadow-inner">
        {/* Road Markings */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/50 border-t border-b border-dashed border-gray-300 transform -translate-y-1/2" />
        
        {/* Signals */}
        <div className="absolute inset-0 flex justify-around pointer-events-none">
          {signals.map((sig) => (
            <div
              key={sig.id}
              className="absolute top-0 flex flex-col items-center h-full"
              style={{ left: `${sig.x}%` }}
            >
              <div className="w-px h-full bg-gray-200" /> {/* Signal line visual */}
              <div className="mt-4">
                <TrafficLight state={sig.state} label={sig.label} />
              </div>
            </div>
          ))}
        </div>

        {/* Vehicles */}
        {vehicles.map((veh) => (
          <VehicleComp key={veh.id} x={veh.x} lane={veh.lane} color={veh.color} />
        ))}

        {/* Road Label */}
        <div className="absolute bottom-4 left-6 px-4 py-1 bg-white/80 rounded-full border border-gray-200 backdrop-blur-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
            Hinjewadi Corridor Simulation • EB Traffic Flow
          </span>
        </div>
      </div>
    </div>
  );
};
