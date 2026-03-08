"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  History, 
  ArrowLeft, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  ChevronRight, 
  Clock,
  Zap,
  Loader2,
  Navigation,
  Mic,
  Users,
  LayoutDashboard,
  Signal,
  MapPin,
  Radio,
  Bell,
  Eye,
  Volume2
} from "lucide-react";
import Link from "next/link";

type TabType = "signals" | "police" | "navigation";

const SignalVisualizer = ({ signal, decisionId }: { signal: any, decisionId: any }) => {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0); // 0: EW_G, 1: EW_Y, 2: NS_G, 3: NS_Y
  const [timeLeft, setTimeLeft] = useState(signal.east_west_green_time_sec - 3);
  const [currentId, setCurrentId] = useState(decisionId);

  const getPhaseDuration = (p: number) => {
    switch(p) {
      case 0: return Math.max(signal.east_west_green_time_sec - 3, 5);
      case 1: return 3;
      case 2: return Math.max(signal.north_south_green_time_sec - 3, 5);
      case 3: return 3;
      default: return 5;
    }
  };

  // Only reset if it's a GENUINELY new decision from the backend
  useEffect(() => {
    if (decisionId !== currentId) {
      setPhase(0);
      setTimeLeft(getPhaseDuration(0));
      setCurrentId(decisionId);
    }
  }, [decisionId, currentId, signal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const nextPhase = ((phase + 1) % 4) as 0 | 1 | 2 | 3;
          setPhase(nextPhase);
          return getPhaseDuration(nextPhase);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, signal]);

  const isEWActive = phase === 0 || phase === 1;
  const isNSActive = phase === 2 || phase === 3;
  const isEWYellow = phase === 1;
  const isNSYellow = phase === 3;

  return (
    <div className="bg-gray-50 border border-gray-100 p-6 rounded-sm relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div className="z-10">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight mb-1">{signal.junction_area}</h4>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest">Ref: SIG-{signal.ref_id || '101'}</span>
          </div>
        </div>
        
        {/* Signal Light Head */}
        <div className="flex flex-col gap-2">
           <div className="flex flex-col gap-1 bg-gray-900 p-1.5 rounded-sm shadow-xl z-10 border border-gray-800">
             <div className={`w-3.5 h-3.5 rounded-full border border-black/20 ${!isEWActive ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-gray-800"}`} />
             <div className={`w-3.5 h-3.5 rounded-full border border-black/20 ${isEWYellow ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" : "bg-gray-800"}`} />
             <div className={`w-3.5 h-3.5 rounded-full border border-black/20 ${phase === 0 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-gray-800"}`} />
           </div>
           <span className="text-[7px] font-black text-center text-gray-400 uppercase tracking-tighter">E/W HEAD</span>
        </div>
        <div className="flex flex-col gap-2">
           <div className="flex flex-col gap-1 bg-gray-900 p-1.5 rounded-sm shadow-xl z-10 border border-gray-800">
             <div className={`w-3.5 h-3.5 rounded-full border border-black/20 ${!isNSActive ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-gray-800"}`} />
             <div className={`w-3.5 h-3.5 rounded-full border border-black/20 ${isNSYellow ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" : "bg-gray-800"}`} />
             <div className={`w-3.5 h-3.5 rounded-full border border-black/20 ${phase === 2 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-gray-800"}`} />
           </div>
           <span className="text-[7px] font-black text-center text-gray-400 uppercase tracking-tighter">N/S HEAD</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 z-10 relative">
        <div className={`p-4 border rounded-sm text-center transition-all duration-500 ${isEWActive ? "bg-white border-blue-200 shadow-md scale-105" : "bg-gray-100/50 border-gray-100 opacity-60"}`}>
           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">E/W PHASE</span>
           <span className={`text-3xl font-black tabular-nums transition-colors ${isEWActive ? (isEWYellow ? "text-yellow-600" : "text-green-600") : "text-red-500"}`}>
            {isEWActive ? timeLeft : "STOP"}
            {isEWActive && <span className="text-[10px] ml-0.5">S</span>}
           </span>
        </div>
        <div className={`p-4 border rounded-sm text-center transition-all duration-500 ${isNSActive ? "bg-white border-green-200 shadow-md scale-105" : "bg-gray-100/50 border-gray-100 opacity-60"}`}>
           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">N/S PHASE</span>
           <span className={`text-3xl font-black tabular-nums transition-colors ${isNSActive ? (isNSYellow ? "text-yellow-600" : "text-green-600") : "text-red-500"}`}>
            {isNSActive ? timeLeft : "STOP"}
            {isNSActive && <span className="text-[10px] ml-0.5">S</span>}
           </span>
        </div>
      </div>

      <div className="bg-orange-50/50 p-4 border border-orange-100/50 rounded-sm z-10 relative">
        <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-1">Active AI Strategy</span>
        <p className="text-[10px] font-bold text-gray-700 leading-relaxed italic">"{signal.reason}"</p>
      </div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 -mr-12 -mt-12 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700" />
    </div>
  );
};

export default function UnifiedCommandCenter() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("signals");
  const [isRecording, setIsRecording] = useState(false);

  const fetchHistory = async () => {
    try {
      if (history.length === 0) setLoading(true);
      const res = await fetch("/api/outputs", { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err: any) {
      console.error("History fetch error:", err);
      setError(err.message || "Failed to load command center data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15000); 
    return () => clearInterval(interval);
  }, []);

  const latestDecision = history.length > 0 ? history[history.length - 1] : null;
  const decisionId = latestDecision?.input?.event_context?.decision_id;

  const renderSignalTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-white border border-gray-100 rounded-sm shadow-xl p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black tracking-tighter uppercase text-gray-900">INTELLIGENT SIGNAL MATRIX</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time Phase Sequencing & Timing</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-sm border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Sync Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {latestDecision?.output?.signal_actions && latestDecision.output.signal_actions.length > 0 ? (
               latestDecision.output.signal_actions.map((signal: any, idx: number) => (
                <SignalVisualizer key={idx} signal={signal} decisionId={decisionId} />
               ))
            ) : (
              <div className="col-span-2 text-center py-20 border-2 border-dashed border-gray-100 rounded-sm">
                <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Waiting for Next AI Cycle</p>
              </div>
            )}
          </div>
        </div>

        {/* Global Overview Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="bg-gray-900 text-white rounded-sm shadow-xl p-8 relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-1">Global Decision Summary</span>
                <h3 className="text-lg font-black leading-tight tracking-tighter mb-4 text-orange-50">
                  {latestDecision?.output?.decision_summary || "Analyzing traffic flows..."}
                </h3>
                <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-orange-500" />
                    Last Updated: {latestDecision?.input?.event_context?.date}
                  </div>
                </div>
              </div>
              <Activity className="absolute bottom-[-20px] right-[-20px] w-40 h-40 text-white/5" />
           </div>

           <div className="bg-white border border-gray-100 rounded-sm shadow-md p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4 mb-6">Audit Stream</h4>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {history.slice(-5).reverse().map((item, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-orange-600 mt-1 shadow-[0_0_8px_rgba(234,88,12,0.6)]" />
                      <div className="w-[1px] h-full bg-gray-100 my-1" />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-[10px] font-black text-gray-900 mb-0.5 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                         {item.input?.venue?.name || "System Update"}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 truncate lowercase">{item.output?.decision_summary}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

const AIVoiceDispatch = ({ actions }: { actions: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransmitting, setIsTransmitting] = useState(true);

  useEffect(() => {
    if (!actions || actions.length === 0) return;
    const interval = setInterval(() => {
      setIsTransmitting(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % actions.length);
        setIsTransmitting(true);
      }, 1000);
    }, 6000);
    return () => clearInterval(interval);
  }, [actions]);

  const currentAction = actions?.[currentIndex] || "Awaiting AI strategy...";

  return (
    <div className="bg-gray-900 text-white rounded-sm shadow-2xl p-8 relative overflow-hidden h-full flex flex-col">
       <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6 relative z-10">
          <div>
            <h3 className="text-lg font-black tracking-tighter uppercase">AI VOICE ORCHESTRATION</h3>
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">Field Command Broadcast</p>
          </div>
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isTransmitting ? 'text-red-500 animate-pulse' : 'text-gray-600'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${isTransmitting ? 'text-red-500' : 'text-gray-600'}`}>
              {isTransmitting ? "TRANSMITTING" : "STANDBY"}
            </span>
          </div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center py-6 gap-8 relative z-10">
          {/* Animated Wave Visualizer */}
          <div className="flex items-end gap-1 h-12 mb-4">
             {[...Array(12)].map((_, i) => (
               <div 
                key={i} 
                className={`w-1 bg-orange-500 rounded-full transition-all duration-300 ${isTransmitting ? 'animate-bounce' : 'h-2 opacity-30'}`}
                style={{ 
                  height: isTransmitting ? `${Math.random() * 100 + 20}%` : '8px',
                  animationDelay: `${i * 0.1}s`
                }}
               />
             ))}
          </div>

          <div className="text-center space-y-4">
             <div className="inline-block bg-orange-600/10 border border-orange-500/30 px-3 py-1 rounded-sm">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">AI Dispatch v.2.4</span>
             </div>
             <div className="min-h-[80px] flex items-center justify-center">
                <p className={`text-sm font-bold text-gray-100 italic leading-relaxed max-w-[300px] transition-all duration-500 ${isTransmitting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  "{currentAction}"
                </p>
             </div>
          </div>
       </div>

       <div className="mt-8 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Dispatcher Status</span>
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Secure Line Encrypted</span>
          </div>
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
             <div 
              className="h-full bg-orange-600 transition-all duration-1000" 
              style={{ width: `${((currentIndex + 1) / (actions?.length || 1)) * 100}%` }}
             />
          </div>
       </div>

       {/* Background Decor */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(234,88,12,0.1),transparent)] pointer-events-none" />
    </div>
  );
};

const renderPoliceTab = () => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="grid grid-cols-12 gap-8">
      {/* AI Voice Dispatch (Replaced Column) */}
      <div className="col-span-12 lg:col-span-5 h-[500px]">
         <AIVoiceDispatch actions={latestDecision?.output?.traffic_management_actions || []} />
      </div>

      {/* Administration & Alerts (Admin Mode) */}
      <div className="col-span-12 lg:col-span-7 bg-white border border-gray-100 rounded-sm shadow-xl p-8 h-[500px] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-10 border-b border-gray-50 pb-8">
          <div>
            <h3 className="text-xl font-black tracking-tighter uppercase text-gray-900">SITUATION WARD</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Force Deployment & Risk Monitoring</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-gray-50 border border-gray-100 p-3 rounded-sm flex items-center gap-4">
                <Users className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-[10px] font-black text-gray-900 block">24 UNITS</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-[7px]">DEPLOYED TODAY</span>
                </div>
             </div>
             <div className="bg-red-50 border border-red-100 p-3 rounded-sm flex items-center gap-4">
                <Bell className="w-5 h-5 text-red-600" />
                <div>
                  <span className="text-[10px] font-black text-red-900 block">4 ALERTS</span>
                  <span className="text-[8px] font-bold text-red-400 uppercase tracking-widest text-[7px]">REQ. ATTENTION</span>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-4 flex items-center gap-3">
               <Eye className="w-3.5 h-3.5 text-blue-600" />
               Current AI Strategy Analysis
            </h4>
            <p className="text-sm font-bold text-gray-800 leading-relaxed bg-blue-50/30 p-6 border border-blue-100/50 rounded-sm italic">
              "{latestDecision?.output?.decision_summary || "Observing sector stability. Monitoring for institutional dismissal peaks."}"
            </p>
          </div>

          <div>
             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 mb-4">Command History Log</h4>
             <div className="space-y-3">
                {latestDecision?.output?.traffic_management_actions?.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-sm hover:translate-x-1 hover:border-blue-200 transition-all cursor-default group">
                     <div className="w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-black text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        {i+1}
                     </div>
                     <span className="text-[10px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors uppercase tracking-tight leading-snug">{action}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

  const renderNavigationTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="grid grid-cols-12 gap-8">
          {/* Navigation Alerts Showcase */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
             <div className="bg-white border border-gray-100 rounded-sm shadow-xl p-8">
               <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-blue-600 rounded-sm shadow-xl">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tighter uppercase text-gray-900">CITIZEN NAVIGATION GATEWAY</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Smart Rerouting & Mobility Advisories</p>
                  </div>
               </div>

               <div className="space-y-6">
                 {latestDecision?.output?.public_advisories?.map((adv: string, i: number) => (
                   <div key={i} className="flex items-stretch bg-gray-50 border border-gray-100 rounded-sm overflow-hidden hover:border-orange-200 transition-colors">
                      <div className="w-1.5 bg-orange-500" />
                      <div className="p-6 flex-1 flex items-start gap-6">
                        <Volume2 className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                        <div className="space-y-2">
                           <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-sm uppercase tracking-widest">Broadcast Active</span>
                           <p className="text-sm font-bold text-gray-800 leading-relaxed">{adv}</p>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-8">
             {/* Rerouting Logic Cards */}
             <div className="bg-blue-900 text-white rounded-sm shadow-xl p-8 relative overflow-hidden">
                <div className="relative z-10">
                   <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-blue-400 mb-6">Proactive Rerouting Suggestions</h4>
                   <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 p-5 rounded-sm group hover:bg-white/10 transition-all">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest">Paud Road Alternative</span>
                            <span className="text-[9px] font-bold text-green-400">SAVE 12 MIN</span>
                         </div>
                         <p className="text-[11px] font-medium text-blue-100">Diverting city-bound traffic via Karve Road Extension to bypass MIT event corridor.</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 p-5 rounded-sm group hover:bg-white/10 transition-all">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest">Bibwewadi Bypass</span>
                            <span className="text-[9px] font-bold text-orange-400">LOAD BALANCING</span>
                         </div>
                         <p className="text-[11px] font-medium text-blue-100">Automated redirection of heavy vehicles via Lullanagar backroads to facilitate Alacrity Fest footfall.</p>
                      </div>
                   </div>
                </div>
                <Zap className="absolute top-10 right-10 w-24 h-24 text-white/5" />
             </div>

             {/* Mappls Sync Indicator */}
             <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">MAPPLS ENGINE SYNC</h5>
                    <p className="text-[9px] font-bold text-green-600 uppercase">Latency: 14ms | Connected</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] font-sans pb-20">
      {/* COMMAND CENTER HEADER */}
      <header className="bg-white border-b border-gray-100 px-10 py-5 sticky top-0 z-[110] shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/atcs" 
              className="p-2 border border-blue-50 bg-blue-50/30 rounded-full hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                <span className="bg-orange-600 text-white px-3 py-1 rounded-sm text-sm tracking-widest">ICCC</span>
                UNIFIED COMMAND CENTER
              </h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest underline decoration-green-500/30">Intelligence Core v4.1 - Active</span>
                 </div>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <nav className="flex items-center bg-gray-50 p-1 border border-gray-100 rounded-sm shadow-inner">
             {[
               { id: "signals", label: "Signal Intelligence", icon: Signal },
               { id: "police", label: "Force Command", icon: ShieldCheck },
               { id: "navigation", label: "Navigation HQ", icon: MapPin }
             ].map((tab) => (
               <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-2 rounded-sm transition-all ${
                  activeTab === tab.id 
                    ? "bg-white text-orange-600 shadow-sm border border-gray-100 translate-y-[-1px]" 
                    : "text-gray-400 hover:text-gray-600"
                }`}
               >
                 <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-orange-600" : "text-gray-300"}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
               </button>
             ))}
          </nav>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-10 py-12">
        {loading && history.length === 0 ? (
          <div className="h-[500px] flex flex-col items-center justify-center gap-6">
             <div className="relative">
                <div className="w-20 h-20 border-4 border-orange-100 border-t-orange-600 rounded-full animate-spin" />
                <Activity className="absolute inset-0 m-auto w-8 h-8 text-orange-600 animate-pulse" />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[.4em] text-gray-900">Synchronizing Global Intelligence Assets</p>
          </div>
        ) : error ? (
           <div className="bg-white border border-red-50 p-12 rounded-sm shadow-2xl max-w-xl mx-auto text-center border-t-red-600 border-t-8">
              <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-6" />
              <h2 className="text-xl font-black uppercase tracking-tight mb-3">Connection Interrupted</h2>
              <p className="text-sm font-bold text-gray-500 uppercase leading-relaxed mb-10 tracking-wide">{error}</p>
              <button 
                onClick={fetchHistory}
                className="w-full bg-gray-900 text-white py-4 rounded-sm font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl"
              >
                Attempt Secure Re-Encryption
              </button>
           </div>
        ) : (
          <>
            {activeTab === "signals" && renderSignalTab()}
            {activeTab === "police" && renderPoliceTab()}
            {activeTab === "navigation" && renderNavigationTab()}
          </>
        )}
      </div>

      {/* FOOTER STATUS BAR */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-10 z-[100] flex justify-between items-center shadow-2xl">
         <div className="flex gap-10">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Network Speed: Fast (380 Mbps)</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-green-500" />
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">API Status: Operational</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[.3em]">Traffic Management System © 2026 iCCC Unified Unit</span>
         </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </main>
  );
}
