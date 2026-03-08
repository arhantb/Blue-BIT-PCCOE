"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  Activity, 
  ChevronRight,
  ShieldCheck,
  Upload,
  Play,
  Pause,
  Zap,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Settings2,
  History,
  TrendingDown,
  Timer,
  BarChart3,
  ActivitySquare
} from "lucide-react";
import { useATCS } from "@/lib/hooks/useATCS";
import { motion, AnimatePresence } from "framer-motion";

export default function SimulationPage() {
  const { data, isProcessing, error, startProcessing, stopProcessing } = useATCS();
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
    north: null, south: null, east: null, west: null
  });
  const [showTrace, setShowTrace] = useState(true);
  const [liveEmergency, setLiveEmergency] = useState<{ dir: string; type: string } | null>(null);
  const [isYellow, setIsYellow] = useState(false);
  const YELLOW_TIME = 3;
  
  // URL MEMOIZATION TO PREVENT LOOPING/RESETS
  const videoUrls = React.useMemo(() => ({
    north: selectedFiles.north ? URL.createObjectURL(selectedFiles.north) : null,
    south: selectedFiles.south ? URL.createObjectURL(selectedFiles.south) : null,
    east: selectedFiles.east ? URL.createObjectURL(selectedFiles.east) : null,
    west: selectedFiles.west ? URL.createObjectURL(selectedFiles.west) : null,
  }), [selectedFiles.north, selectedFiles.south, selectedFiles.east, selectedFiles.west]);

  // SEQUENCER STATE
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['north']));
  const [frozenTelemetry, setFrozenTelemetry] = useState<Record<string, any>>({});
  const [prioritySequence, setPrioritySequence] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Monitor for immediate emergency detections (before 3-frame validation)
  useEffect(() => {
    if (!data?.intersection_telemetry) return;
    
    const detected = Object.entries(data.intersection_telemetry).find(
      ([_, t]: any) => t.emergency_detected
    );

    if (detected) {
      setLiveEmergency({ dir: detected[0].toUpperCase(), type: (detected[1] as any).emergency_type });
      // Clear after 3 seconds if not confirmed or if detection lost
      const timer = setTimeout(() => setLiveEmergency(null), 3000);
      return () => clearTimeout(timer);
    } else {
      setLiveEmergency(null);
    }
  }, [data]);
  
  const fileInputRefs = {
    north: useRef<HTMLInputElement>(null),
    south: useRef<HTMLInputElement>(null),
    east: useRef<HTMLInputElement>(null),
    west: useRef<HTMLInputElement>(null),
  };

  const handleFileChange = (dir: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFiles(prev => ({ ...prev, [dir]: e.target.files![0] }));
    }
  };

  const handleStart = async () => {
    if (!Object.values(selectedFiles).every(f => f !== null)) return;
    
    setIsAnalyzing(true);
    setActivePhase(null);
    setPrioritySequence([]);
    
    // 1. PERFORM BATCH PRE-ANALYSIS
    const formData = new FormData();
    Object.entries(selectedFiles).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });
    formData.append("task_type", "pre-analysis");

    try {
      const response = await fetch("http://localhost:8000/api/atcs/upload-intersection", {
        method: "POST",
        body: formData,
      });
      const batchData = await response.json();
      
      if (batchData.priority_sequence) {
        setPrioritySequence(batchData.priority_sequence);
        // Start the actual simulation polling
        startProcessing(selectedFiles as Record<string, File>);
      }
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // HANDLE SEQUENCING LOGIC
  useEffect(() => {
    if (!isProcessing) {
      setActivePhase(null);
      setRemainingTime(0);
      setFrozenTelemetry({});
      setIsYellow(false);
      return;
    }

    if (data && prioritySequence.length > 0 && !activePhase) {
      // Start with the #1 priority from backend
      const firstPhase = prioritySequence[0];
      setActivePhase(firstPhase);
      const splitTime = data.signal_plan?.splits?.[firstPhase] || 20;
      setRemainingTime(splitTime);
      setFrozenTelemetry({ [firstPhase]: data.intersection_telemetry[firstPhase] });
    }
  }, [data, isProcessing, activePhase, prioritySequence]);

  // COUNTDOWN TICKER
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing && remainingTime > 0 && prioritySequence.length > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else if (isProcessing && remainingTime <= 0 && activePhase && prioritySequence.length > 0) {
      if (!isYellow) {
        // Switch to Yellow phase
        setIsYellow(true);
        setRemainingTime(YELLOW_TIME);
      } else {
        // Yellow phase finished, switch to Green for next phase
        setIsYellow(false);
        const currentIndex = prioritySequence.indexOf(activePhase);
        const nextIndex = (currentIndex + 1) % 4;
        const nextPhase = prioritySequence[nextIndex];
        
        setActivePhase(nextPhase);
        const nextSplit = data?.signal_plan?.splits?.[nextPhase] || 20;
        setRemainingTime(nextSplit);
        
        if (data) {
          setFrozenTelemetry(prev => ({ ...prev, [nextPhase]: data.intersection_telemetry[nextPhase] }));
        }
      }
    }
    return () => clearInterval(timer);
  }, [remainingTime, isProcessing, activePhase, data, prioritySequence]);

  const toggleDir = (dir: string) => {
    const next = new Set(expandedDirs);
    if (next.has(dir)) next.delete(dir);
    else next.add(dir);
    setExpandedDirs(next);
  };

  const isReady = Object.values(selectedFiles).every(f => f !== null);

  // Get display telemetry for a direction (Frozen if active, live otherwise)
  const getTelemetry = (dir: string) => {
    if (!data) return null;
    if (activePhase === dir && frozenTelemetry[dir]) return frozenTelemetry[dir];
    return data.intersection_telemetry[dir];
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans">
      
      {/* ICCC HEADER */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-[100] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1">Integrated Command & Control</span>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
               ATCS DIGITAL TWIN CONSOLE
               <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">BATCH_PRIORITY v2.0</span>
            </h1>
          </div>
          <div className="h-8 w-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-8">
             <StatBox label="Execution Mode" value={isAnalyzing ? "ANALYZING" : "PRIORITY_LINK"} color={isAnalyzing ? "text-orange-500 animate-pulse" : "text-green-600 font-bold"} />
             <StatBox label="Active Phase" value={activePhase?.toUpperCase() || (isAnalyzing ? "RANKING..." : "IDLE")} color="text-orange-600 font-bold" />
             <StatBox label="Time Remaining" value={`${remainingTime}s`} color="text-gray-900 font-mono" />
          </div>
        </div>

        <div className="flex items-center gap-4">
           {!isProcessing ? (
             <button 
              disabled={!isReady}
              onClick={handleStart}
              className={`flex items-center gap-2 px-8 py-2.5 rounded-sm font-black text-xs uppercase tracking-widest transition-all ${isReady ? "bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"}`}
             >
                <Play className="w-4 h-4 fill-current" />
                Initiate Control Loop
             </button>
           ) : (
             <button 
              onClick={stopProcessing}
              className="flex items-center gap-2 bg-red-600 text-white px-8 py-2.5 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
             >
                <Pause className="w-4 h-4 fill-current" />
                Terminate Link
             </button>
           )}
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto p-10 space-y-10 relative">
        
        {/* GLOBAL PROCESSING OVERLAY */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[200] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
            >
               <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-orange-100 border-t-orange-600 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <BrainCircuit className="w-8 h-8 text-orange-600 animate-pulse" />
                  </div>
               </div>
               <div className="flex flex-col items-center text-center">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Initializing Batch Intelligence</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Analyzing full video duration for 4-way priority ranking...</p>
               </div>
               <div className="flex gap-4 mt-4">
                  {["NORTH", "SOUTH", "EAST", "WEST"].map(d => (
                    <div key={d} className="flex flex-col items-center gap-1">
                       <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-ping" />
                       <span className="text-[8px] font-black text-gray-400">{d}</span>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* LIVE EMERGENCY DETECTION POPUP (IMMEDIATE) */}
        <AnimatePresence>
          {liveEmergency && !data?.signal_plan?.safety_override && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-gray-900 text-white px-10 py-6 rounded-sm shadow-[0_0_50px_rgba(239,68,68,0.4)] border-b-4 border-red-600 flex flex-col items-center gap-4"
            >
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                     <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Intelligent Threat Detection</span>
                     <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                       {liveEmergency.type.replace('_', ' ')} SPOTTED: {liveEmergency.dir}
                     </h2>
                  </div>
               </div>
               <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-red-600"
                  />
               </div>
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Temporal Validation for Signal Preemption...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* EMERGENCY PRIORITY PANEL (VALIDATED) */}
        <AnimatePresence>
          {data?.signal_plan?.safety_override && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-600 text-white p-4 rounded-sm shadow-xl border-2 border-red-400 flex items-center justify-between overflow-hidden relative"
            >
               <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 bg-red-500" />
               <div className="relative flex items-center gap-4">
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Priority Preemption Active</span>
                     <span className="text-xl font-black uppercase tracking-tighter">🚨 Emergency Override: {data.signal_plan.selected_phase}</span>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          <div className="xl:col-span-8 space-y-8">
            {/* 4-WAY FEED GRID */}
            <div className="grid grid-cols-2 gap-8">
               {["north", "south", "east", "west"].map((dir) => (
                  <div key={dir} className="bg-white border border-gray-200 rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
                     <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{dir} Approach Component</span>
                        
                        {/* MICRO SIGNALS - SYNCED TO SEQUENCER */}
                        <div className="flex items-center gap-3">
                           <div className="flex gap-2 p-1.5 bg-gray-900 rounded-sm border border-white/5 shadow-inner transition-all duration-300">
                              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activePhase === dir && !isYellow ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] scale-110' : 'bg-gray-800'}`} title="Green" />
                              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activePhase === dir && isYellow ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] scale-110' : 'bg-gray-800'}`} title="Yellow" />
                              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activePhase !== dir ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-110' : 'bg-gray-800'}`} title="Red" />
                           </div>
                           
                           {/* PROMINENT COUNTDOWN TIMER */}
                           {activePhase === dir && (
                             <div className="flex items-center px-2 py-1 bg-gray-50 border border-gray-100 rounded-sm animate-in fade-in zoom-in duration-300">
                               <Timer className={`w-3.5 h-3.5 mr-1.5 ${isYellow ? 'text-yellow-600' : 'text-green-600'}`} />
                               <span className={`text-sm font-black font-mono tracking-tighter ${isYellow ? 'text-yellow-600' : 'text-green-600'}`}>
                                 {remainingTime < 10 ? `0${remainingTime}` : remainingTime}s
                               </span>
                             </div>
                           )}

                           <div className="h-4 w-px bg-gray-200 ml-1" />
                           <span className="text-[9px] font-black text-gray-400 uppercase tracking-tight font-mono">ID: {dir[0].toUpperCase()}</span>
                        </div>
                     </div>
                     
                     <div className="aspect-video bg-gray-100 relative group overflow-hidden">
                        {activePhase === dir && isProcessing && (
                          <div className="absolute inset-0 bg-green-500/10 z-10 pointer-events-none border-4 border-green-500/30" />
                        )}
                        
                        {selectedFiles[dir] ? (
                          <>
                             <video 
                               className={`w-full h-full object-cover transition-opacity duration-500 ${isProcessing ? 'opacity-80' : 'opacity-40'}`} 
                               src={videoUrls[dir as keyof typeof videoUrls]!} 
                               autoPlay 
                               loop 
                               muted 
                             />
                             <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                                <div className="flex justify-between items-start">
                                   <div className={`bg-black/80 backdrop-blur-md px-2 py-1 flex items-center gap-2 ${activePhase === dir ? 'border border-green-500' : ''}`}>
                                      <Activity className={`w-3 h-3 ${activePhase === dir ? 'text-green-500' : 'text-orange-500'}`} />
                                      <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                                        {activePhase === dir ? 'PHASE_EXECUTING' : 'ANALYZING_DENSITY'}
                                      </span>
                                   </div>
                                </div>
                                <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                                   <div className="bg-gray-900 text-white px-2 py-0.5 text-[10px] font-black uppercase shadow-lg">
                                      Q: {getTelemetry(dir)?.raw_queue || 0}
                                   </div>
                                </div>
                             </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer" onClick={() => (fileInputRefs as any)[dir].current?.click()}>
                             <Upload className="w-6 h-6 text-gray-500" />
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Click to Upload Video</span>
                             <input type="file" className="hidden" ref={(fileInputRefs as any)[dir]} onChange={(e) => handleFileChange(dir, e)} />
                          </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>

            {/* INTELLIGENCE ENGINE */}
            <div className="bg-white border border-gray-200 rounded-sm shadow-lg overflow-hidden">
               <div className="bg-gray-900 px-8 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <BrainCircuit className="w-6 h-6 text-orange-500" />
                     <h2 className="text-md font-black text-white uppercase tracking-[0.2em]">Decision Intelligence Engine</h2>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logic Source:</span>
                     <span className="px-3 py-1 bg-white/10 text-orange-400 text-[10px] font-black rounded-sm border border-white/5">HYBRID MAX-P + SEQUENTIAL CONTROLLER</span>
                  </div>
               </div>

               <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-12">
                  <div className="md:col-span-4 space-y-6">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Settings2 className="w-3 h-3" />
                        Cycle Parameterization
                     </span>
                     <div className="space-y-4">
                        <FormulaRow label="Base Cycle" value={`${data?.signal_plan?.cycle_breakdown?.base || 90}s`} />
                        <FormulaRow label="Load Factor" value={`+${data?.signal_plan?.cycle_breakdown?.load_adj || 0}s`} highlight />
                        <FormulaRow label="Emergency Offset" value={`+${data?.signal_plan?.cycle_breakdown?.emergency_adj || 0}s`} color="text-red-500" />
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                           <span className="text-sm font-black text-gray-900 uppercase">Final Cycle Time</span>
                           <span className="text-2xl font-black text-orange-600">{data?.signal_plan?.cycle_breakdown?.final || 90}s</span>
                        </div>
                     </div>
                  </div>

                  <div className="md:col-span-5 space-y-6 border-l border-gray-100 pl-8">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" />
                        Controller Progress
                     </span>
                     <div className="space-y-6 pt-2">
                        {data?.signal_plan?.splits && Object.entries(data.signal_plan.splits).map(([dir, val]: any) => (
                          <div key={dir} className={`space-y-1.5 p-2 rounded-sm transition-colors ${activePhase === dir.toLowerCase() ? 'bg-green-50 border border-green-100' : ''}`}>
                             <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-gray-900">{dir} Approach</span>
                                <span className={activePhase === dir.toLowerCase() ? 'text-green-600 animate-pulse' : 'text-orange-600'}>
                                  {activePhase === dir.toLowerCase() ? `${remainingTime}s REMAINING` : `${val}s PLAN`}
                                </span>
                             </div>
                             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: activePhase === dir.toLowerCase() ? `${(remainingTime / val) * 100}%` : '100%' }}
                                  transition={{ duration: 1, ease: "linear" }}
                                  className={`h-full ${activePhase === dir.toLowerCase() ? 'bg-green-500' : 'bg-gray-400'}`}
                                />
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="md:col-span-3 space-y-6 border-l border-gray-100 pl-8">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Execution</span>
                     <div className="flex flex-col gap-6">
                        <div>
                           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Current Active Phase</span>
                           <span className="text-lg font-black text-green-600 uppercase animate-pulse">{activePhase || "--"}</span>
                        </div>
                        <div>
                           <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Controller Status</span>
                           <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-green-100 text-green-700 border border-green-200">
                              {isProcessing ? 'SEQUENCING_LANE' : 'STANDBY'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* AI REASONING TRACE */}
               <div className="border-t border-gray-100">
                  <button onClick={() => setShowTrace(!showTrace)} className="w-full px-8 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-3">
                        <BrainCircuit className="w-4 h-4 text-orange-600" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Decision Explanation (AI Trace Log)</span>
                     </div>
                     {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <AnimatePresence>
                    {showTrace && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                         <div className="p-8 pt-0 bg-gray-50 border-t border-gray-100">
                            <div className="bg-white border border-gray-200 p-6 rounded-sm space-y-3 shadow-inner">
                               <p className="text-xs font-mono text-gray-600 italic leading-relaxed">
                                  {data?.signal_plan?.reasoning || "Link initialization required to compute AI audit trace..."}
                               </p>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
             {/* THE REAL-TIME FEED WITH COLLAPSIBLE DROPDOWNS */}
             <div className="bg-white border border-gray-200 p-8 rounded-sm shadow-sm h-full flex flex-col min-h-[850px]">
                
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-orange-600" />
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Live Feedback Matrix</h3>
                   </div>
                   <div className="flex items-center gap-2 text-orange-600 animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-current" />
                      <span className="text-[9px] font-black uppercase">Sampling_Data</span>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                   {data ? (
                     Object.entries(data.intersection_telemetry).map(([dir, t]: any) => {
                        const isExpanded = expandedDirs.has(dir);
                        const isGreen = activePhase === dir.toLowerCase();
                        const displayTelemetry = getTelemetry(dir);
                        const rank = prioritySequence.indexOf(dir.toLowerCase()) + 1;
                        
                        return (
                          <div key={dir} className={`bg-white border transition-all duration-300 ${isGreen ? 'border-l-4 border-l-green-500 border-green-200 bg-green-50/20' : 'border-gray-100 border-l-4 border-l-orange-500 shadow-sm'}`}>
                             <button 
                               onClick={() => toggleDir(dir)}
                               className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                             >
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${isGreen ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : isAnalyzing ? 'bg-orange-400 animate-pulse' : 'bg-orange-500'}`} />
                                   <div className="flex flex-col items-start translate-y-[1px]">
                                      <span className="text-[11px] font-black uppercase text-gray-900 tracking-tight leading-none mb-1">{dir} Approach</span>
                                      {prioritySequence.length > 0 && (
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${rank === 1 ? 'text-orange-600' : 'text-gray-400'}`}>
                                          PRIORITY RANK #{rank}
                                        </span>
                                      )}
                                   </div>
                                </div>
                                <div className="flex items-center gap-4">
                                   {isAnalyzing && <span className="text-[8px] font-bold text-orange-500 animate-pulse uppercase">ANALYZING...</span>}
                                   {isGreen && <span className="text-[9px] font-black text-green-600 animate-pulse uppercase tracking-widest">EXECUTING</span>}
                                   {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                             </button>
                             
                             <AnimatePresence>
                               {isExpanded && (
                                 <motion.div 
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: "auto", opacity: 1 }}
                                   exit={{ height: 0, opacity: 0 }}
                                   className="overflow-hidden border-t border-gray-50"
                                 >
                                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-2 bg-white/50">
                                       <LogItem label="Raw Vehicle Count" value={displayTelemetry.raw_queue} />
                                       <LogItem label="Queue Length" value={displayTelemetry.smoothed_queue.toFixed(2)} />
                                       <LogItem label="Phase Pressure" value={displayTelemetry.pressure.toFixed(2)} highlight={!isGreen} />
                                       <LogItem label="Split Cycle" value={`${displayTelemetry.split_percent}%`} />
                                       <LogItem label="Allotted Green" value={`${displayTelemetry.assigned_green}s`} color="text-orange-600" />
                                       <LogItem label="Confidence" value={`${Math.round(displayTelemetry.confidence * 100)}%`} />
                                       
                                       {isGreen && (
                                         <div className="col-span-2 pt-4 flex flex-col gap-2">
                                            <div className="flex justify-between items-end">
                                               <span className="text-[8px] font-black text-green-600 uppercase">Phase Remaining</span>
                                               <span className="text-xl font-black text-green-600 font-mono tracking-tighter">{remainingTime}s</span>
                                            </div>
                                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                               <motion.div 
                                                 initial={{ width: "100%" }}
                                                 animate={{ width: "0%" }}
                                                 transition={{ duration: remainingTime, ease: "linear" }}
                                                 className="h-full bg-green-500"
                                               />
                                            </div>
                                         </div>
                                       )}
                                    </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                        );
                     })
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 py-40">
                        <ActivitySquare className="w-16 h-16" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting data stream...</span>
                     </div>
                   )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-600" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SAMPLING_ACTIVE</span>
                   </div>
                   <span className="text-[8px] font-bold text-gray-300 underline">SYSTEM_VERSION_4.5_SEQ</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-xs font-black uppercase tracking-tight ${color}`}>{value}</span>
    </div>
  );
}

function FormulaRow({ label, value, highlight = false, color = "text-gray-900" }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between group px-1">
       <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight group-hover:text-gray-900 transition-colors">{label}</span>
       <span className={`text-[12px] font-black ${highlight ? 'text-orange-600 underline underline-offset-4 decoration-orange-200' : color}`}>{value}</span>
    </div>
  );
}

function LogItem({ label, value, highlight = false, color = "text-gray-900" }: { label: string; value: string | number; highlight?: boolean; color?: string }) {
  return (
    <div className="flex flex-col">
       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</span>
       <span className={`text-[12px] font-black tracking-tight ${highlight ? 'text-orange-600' : color}`}>{value}</span>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
   return (
      <div className="bg-white border border-gray-100 p-4 rounded-sm shadow-sm flex flex-col gap-2">
         <div className="flex items-center gap-2 text-gray-400">
            {icon}
            <span className="text-[9px] font-black uppercase">{label}</span>
         </div>
         <span className="text-xl font-black text-gray-900 tracking-tighter">{value}</span>
      </div>
   );
}
