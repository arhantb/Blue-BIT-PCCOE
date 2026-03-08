"use client";

import React from "react";
import { Camera, Radio, Bluetooth, Navigation, TrainFront, Users, Calendar, Building, Info, Star } from "lucide-react";

interface SensorItemProps {
  icon: React.ReactNode;
  label: string;
  measure: string;
  reliability: number;
  role: string;
  weight?: string;
}

function SensorCard({ icon, label, measure, reliability, role, weight }: SensorItemProps) {
  return (
    <div className="bg-white p-5 rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-md text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
          {icon}
        </div>
        {weight && (
          <div className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase tracking-widest">
            Weight: {weight}
          </div>
        )}
      </div>
      <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-900 mb-1">{label}</h4>
      <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">{measure}</p>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Reliability</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 h-3 ${i < reliability ? "fill-orange-500 text-orange-500" : "text-gray-200"}`} 
              />
            ))}
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded text-[10px] font-medium text-gray-600 border-l-2 border-orange-500">
          <span className="font-black text-gray-900 mr-1 uppercase">Role:</span> {role}
        </div>
      </div>
    </div>
  );
}

export default function DataIntegrationLayer() {
  return (
    <div className="space-y-12 py-8">
      {/* Formula Header */}
      <div className="bg-gray-900 p-8 rounded-md text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-4 border-orange-600">
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tight">Active Weighted Fusion</h3>
          <p className="text-sm text-gray-400 font-medium">Recursive state estimation using Kalman-weighted multimodal sensing.</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-md backdrop-blur-sm">
          <code className="text-lg font-black tracking-tighter text-orange-400">
            Final State = Σ (w<sub className="text-xs">i</sub> × x<sub className="text-xs">i</sub>) / Σ w<sub className="text-xs">i</sub>
          </code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Traditional Data */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-1.5 h-6 bg-green-500 rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Traditional Data (High Reliability)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SensorCard 
              icon={<Camera className="w-5 h-5" />}
              label="CCTV / YOLO"
              measure="Queue Length"
              reliability={5}
              role="Direct state measurement"
            />
            <SensorCard 
              icon={<Navigation className="w-5 h-5" />}
              label="GPS / AVL"
              measure="Approach Speed"
              reliability={4}
              role="Congestion trend detection"
            />
            <SensorCard 
              icon={<Bluetooth className="w-5 h-5" />}
              label="Bluetooth OD"
              measure="Origin-Destination"
              reliability={3}
              role="Corridor travel time estimation"
            />
            <SensorCard 
              icon={<Radio className="w-5 h-5" />}
              label="Loops/Radar"
              measure="Flow/Volume"
              reliability={5}
              role="Baseline throughput count"
            />
          </div>
        </div>

        {/* Non-Traditional Data */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Non-Traditional (Predictive Layer)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SensorCard 
              icon={<TrainFront className="w-5 h-5" />}
              label="Metro Discharge"
              measure="Temporal Spikes"
              reliability={4}
              role="Predictive inflow bias (Metros arriving)"
              weight="0.45"
            />
            <SensorCard 
              icon={<Users className="w-5 h-5" />}
              label="Mobility Surge"
              measure="API Load/Req"
              reliability={3}
              role="Anticipating ride-hailing demand"
              weight="0.25"
            />
            <SensorCard 
              icon={<Calendar className="w-5 h-5" />}
              label="Event Schedule"
              measure="Static Schedule"
              reliability={5}
              role="Planned bypass routing"
              weight="0.15"
            />
            <SensorCard 
              icon={<Building className="w-5 h-5" />}
              label="Institutional Exit"
              measure="Fixed Egress"
              reliability={4}
              role="Managing massive bulk flows"
              weight="0.15"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
