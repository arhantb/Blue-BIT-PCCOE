"use client";

import React from "react";
import { Settings, Zap, Play, Shield, RotateCcw } from "lucide-react";

interface ControlPanelProps {
  isPredictive: boolean;
  spillbackEnabled: boolean;
  surgeActive: boolean;
  cycleLength: number;
  offset: number;
  kalmanGain: number;
  onTogglePredictive: () => void;
  onToggleSpillback: () => void;
  onTriggerSurge: () => void;
  onReset: () => void;
  onCycleChange: (val: number) => void;
  onOffsetChange: (val: number) => void;
  onKalmanChange: (val: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  isPredictive,
  spillbackEnabled,
  surgeActive,
  cycleLength,
  offset,
  kalmanGain,
  onTogglePredictive,
  onToggleSpillback,
  onTriggerSurge,
  onReset,
  onCycleChange,
  onOffsetChange,
  onKalmanChange,
}) => {
  return (
    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-black flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-400" />
          Simulation Control
        </h3>
        <button 
          onClick={onReset}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Switche Sections */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">System Modes</label>
          <div className="space-y-3">
             <button 
              onClick={onTogglePredictive}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                isPredictive ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-gray-100 text-gray-600"
              }`}
             >
               <span className="text-sm font-bold">Predictive Mode</span>
               <Play className={`w-4 h-4 ${isPredictive ? "fill-orange-500" : ""}`} />
             </button>

             <button 
              onClick={onToggleSpillback}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                spillbackEnabled ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-gray-100 text-gray-600"
              }`}
             >
               <span className="text-sm font-bold">Spillback Prevention</span>
               <Shield className={`w-4 h-4 ${spillbackEnabled ? "fill-green-500" : ""}`} />
             </button>
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Cycle Parameters</label>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Cycle Length</span>
                <span className="font-bold">{cycleLength}s</span>
              </div>
              <input 
                type="range" min="40" max="180" step="10" value={cycleLength}
                onChange={(e) => onCycleChange(parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Signal Offset</span>
                <span className="font-bold">{offset}s</span>
              </div>
              <input 
                type="range" min="0" max="40" step="5" value={offset}
                onChange={(e) => onOffsetChange(parseInt(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Kalman Gain */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">AI Filtering</label>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Kalman Smoothing</span>
              <span className="font-bold">{(kalmanGain * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" min="0.01" max="1" step="0.05" value={kalmanGain}
              onChange={(e) => onKalmanChange(parseFloat(e.target.value))}
              className="w-full accent-green-600"
            />
            <p className="text-[9px] text-gray-400 mt-2 leading-tight">
              Higher ratio reacts faster to noise; Lower ratio provides smoother prediction.
            </p>
          </div>
        </div>

        {/* Trigger */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Manual Intervention</label>
          <button
            onClick={onTriggerSurge}
            disabled={surgeActive}
            className={`w-full h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${
              surgeActive ? "bg-red-50 border-red-200 text-red-500" : "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200 hover:scale-[1.02]"
            }`}
          >
            <Zap className={`w-8 h-8 ${surgeActive ? "animate-pulse" : ""}`} />
            <span className="text-xs font-black uppercase tracking-widest">
              {surgeActive ? "Zone Surge Active" : "Trigger Phase 1 Surge"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
