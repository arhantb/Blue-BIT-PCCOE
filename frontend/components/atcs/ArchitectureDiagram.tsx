"use client";

import React, { useState } from "react";
import { Database, Filter, Activity, Brain, Zap, ChevronRight, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const layers = [
  {
    id: "data",
    title: "Data Ingestion",
    icon: <Database className="w-6 h-6" />,
    description: "Multi-modal sensing layer aggregating real-time inputs from varied sources.",
    details: ["CCTV (YOLO Queue)", "GPS Probes", "Loop Sensors", "Event Feeds"]
  },
  {
    id: "fusion",
    title: "Sensor Fusion",
    icon: <Filter className="w-6 h-6" />,
    description: "Kalman filtering and reliability weighting to normalize noisy Indian traffic data.",
    details: ["Noise Reduction", "Bias Compensation", "Outlier Detection"]
  },
  {
    id: "estimation",
    title: "State Estimation",
    icon: <Activity className="w-6 h-6" />,
    description: "Calculating junction-level pressure and corridor-wide flow dynamics.",
    details: ["Queue Length", "Arrival Rate", "Downstream Occupancy"]
  },
  {
    id: "control",
    title: "Hybrid Control",
    icon: <Brain className="w-6 h-6" />,
    description: "Decision engine combining Max-Pressure stability with DRL optimization.",
    details: ["Max-Pressure Baseline", "DRL Phase Selection", "Spillback Protection"]
  },
  {
    id: "optimization",
    title: "Signal Optimization",
    icon: <Zap className="w-6 h-6" />,
    description: "Final actuation of adaptive green splits and corridor offsets.",
    details: ["Dynamic Cycle Length", "Split Allocation", "Green Wave Coordination"]
  }
];

export default function ArchitectureDiagram() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <div className="w-full py-12">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {layers.map((layer, index) => (
          <div key={layer.id} className="relative group">
            <motion.div
              layoutId={layer.id}
              onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
              className={`
                cursor-pointer p-6 rounded-md border-2 transition-all duration-300
                ${activeLayer === layer.id 
                  ? "bg-white border-orange-500 shadow-md ring-1 ring-orange-100" 
                  : "bg-gray-50 border-gray-100 hover:border-orange-200 hover:bg-white"}
              `}
            >
              <div className={`mb-4 flex items-center justify-center w-12 h-12 rounded-md ${activeLayer === layer.id ? "bg-orange-600 text-white" : "bg-white text-gray-400 group-hover:text-orange-500 shadow-sm"}`}>
                {layer.icon}
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-1">{layer.title}</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                {layer.description}
              </p>
              
              <div className="mt-4 flex items-center text-[10px] font-bold text-orange-600 uppercase tracking-tighter">
                <span>View Details</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </motion.div>

            {index < layers.length - 1 && (
              <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                <ChevronRight className="w-4 h-4 text-gray-200" />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeLayer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-8 p-8 bg-gray-50 rounded-md border border-gray-100 shadow-sm"
          >
            <div className="flex items-start gap-6">
              <div className="p-4 bg-white rounded-md shadow-sm border border-gray-100">
                {layers.find(l => l.id === activeLayer)?.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">
                  {layers.find(l => l.id === activeLayer)?.title}
                </h3>
                <p className="text-sm text-gray-600 font-medium mb-6 max-w-2xl">
                  {layers.find(l => l.id === activeLayer)?.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {layers.find(l => l.id === activeLayer)?.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white px-4 py-2 rounded-md border border-gray-100 shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setActiveLayer(null)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
