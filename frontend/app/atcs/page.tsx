"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Users,
  Navigation,
  Activity,
  Loader2,
  Globe,
  Cpu,
  ExternalLink,
  Map as MapIcon,
  CheckCircle2,
  History,
  LayoutDashboard,
  Info,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

// Types & Mock Data
import { ATCSDecisionSchema } from "@/types/atcs";
import { mockATCSDecision } from "@/mock/atcsDecision";

import dynamic from "next/dynamic";

// New ICCC Dashboard Components
import DataIngestionPanel from "@/components/dashboard/DataIngestionPanel";
const MapIntelligencePanel = dynamic(
  () => import("@/components/dashboard/MapIntelligencePanel"),
  { ssr: false },
);
import AIReasoningEngine from "@/components/dashboard/AIReasoningEngine";
import SignalActionsPanel from "@/components/dashboard/SignalActionsPanel";
import RiskAssessmentPanel from "@/components/dashboard/RiskAssessmentPanel";
import AdvisoryPanel from "@/components/dashboard/AdvisoryPanel";
import TrafficManagementPanel from "@/components/dashboard/TrafficManagementPanel";

export default function ATCSDashboard() {
  const [dataList, setDataList] = useState<ATCSDecisionSchema[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Using the robust /api/data proxy with GET method as per backend documentation
      const response = await fetch("/api/data", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const raw = await response.json();

      // Map the input and output arrays into the Unified Schema Format
      // Robustly handle different key casings and pluralization (Input/input/inputs)
      const inputArr =
        raw.Input ||
        raw.input ||
        raw.Inputs ||
        raw.inputs ||
        (Array.isArray(raw) ? raw : []);
      const outputArr =
        raw.Output ||
        raw.output ||
        raw.Outputs ||
        raw.outputs ||
        (Array.isArray(raw) ? raw : []);

      const unified: ATCSDecisionSchema[] = inputArr.map(
        (item: any, idx: number) => {
          // If the item itself has input/output properties (e.g. from map_to_schema), use them
          const inputData = item.input || item;
          const outputData =
            outputArr[idx]?.output ||
            outputArr[idx] ||
            outputArr[0]?.output ||
            outputArr[0] ||
            {};

          return {
            input: inputData,
            output: outputData,
          };
        },
      );

      if (unified.length === 0)
        throw new Error("No mobility data available in the current stream.");

      setDataList(unified);
      setLoading(false);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError(err.message || "Connection to Mobility Cloud timed out.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto-sync every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading && dataList.length === 0)
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center font-black uppercase tracking-widest text-gray-400 italic">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          Synchronizing ICCC Unified Core...
        </div>
      </div>
    );

  if (error && dataList.length === 0)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-10">
        <div className="max-w-md w-full bg-white border border-red-100 p-8 rounded-sm shadow-xl text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">
            ICCC Connection Lost
          </h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchData}
            className="w-full bg-orange-600 text-white py-3 rounded-sm font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-900/20 hover:bg-orange-700 transition-all"
          >
            Re-Initialize System
          </button>
        </div>
      </div>
    );

  const data = dataList[activeIndex] || mockATCSDecision;

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-[#1a1a1a] font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      {/* --- LEVEL 1: CORPORATE HEADER --- */}
      <header className="bg-white border-b border-gray-100 px-10 py-5 sticky top-0 z-[110] shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                PUNE
                <span className="text-orange-600 underline decoration-4 decoration-orange-200 underline-offset-4">
                  SMART
                </span>
                CITY
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-gray-900 text-white px-2 py-0.5 rounded-sm tracking-[0.2em] font-black uppercase shadow-sm">
                  ICCC-CORE
                </span>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  Adaptive Traffic Intelligence Unit
                </p>
              </div>
            </div>
          </div>

          {/* SECTOR SELECTOR TABS */}
          <div className="hidden lg:flex items-center bg-gray-50 p-1 border border-gray-100 rounded-sm">
            {dataList.map((sector, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm ${activeIndex === idx ? "bg-white text-orange-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"}`}
              >
                {sector.input.venue.name.split(",")[0]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden xl:flex items-center gap-6 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-100 italic transition-all hover:bg-white hover:shadow-inner">
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                  Network Reliability
                </span>
                <span className="text-xs font-black text-green-600 tracking-tighter flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                  {Math.round(data.output.confidence * 100)}% Confident
                </span>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex flex-col items-start min-w-[120px]">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                  System Health
                </span>
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-[92%]" />
                  </div>
                  <span className="text-[10px] font-black text-gray-900">
                    92%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className={`p-2.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all shadow-sm ${loading ? "animate-spin" : ""}`}
              >
                <Globe className="w-5 h-5 text-gray-400" />
              </button>
              <button className="flex items-center gap-3 bg-gray-900 text-white px-6 py-2.5 rounded-full shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all font-black text-xs uppercase tracking-widest group">
                <LayoutDashboard className="w-4 h-4 text-orange-500 group-hover:rotate-12 transition-transform" />
                S.H.I.F.T
              </button>
            </div>
            <Link
              href="/atcs_output"
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-4 py-2 rounded-sm transition-all group"
            >
              <History className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                Decision Logs
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* --- LEVEL 2: CONTEXTUAL BREADCRUMB --- */}
      <div className="bg-white/60 backdrop-blur-md border-b border-gray-100 px-10 py-3 sticky top-[81px] z-[100]">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 text-gray-950 px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
              <Activity className="w-3 h-3 text-orange-600 animate-pulse" />{" "}
              Live Analysis
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Sector:</span>
              <span className="text-orange-600">{data.input.venue.name}</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Context:</span>
              <span className="text-gray-900 truncate max-w-[300px]">
                {data.input.event_context.likely_event_today}
              </span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Congestion:</span>
              <span
                className={`px-2 py-0.5 rounded-sm ${data.input.traffic_prediction.severity === "HIGH" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
              >
                {data.input.traffic_prediction.severity}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-gray-400">
              <Info className="w-3.5 h-3.5" /> Mobility Cloud Active
            </span>
            <div className="text-orange-600 flex items-center gap-1">
              Active Loop: {data.output.next_review_in_minutes}m
            </div>
          </div>
        </div>
      </div>

      {/* --- LEVEL 3: DASHBOARD WORKSPACE --- */}
      <div className="max-w-[1800px] mx-auto p-10 space-y-12 pb-48">
        {/* ROW 1: THE COMMAND CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* LEFT PANEL: INPUT TELEMETRY */}
          <div className="lg:col-span-3 flex flex-col gap-10">
            <div className="flex-1">
              <DataIngestionPanel input={data.input} />
            </div>
            <div className="hidden lg:block">
              <RiskAssessmentPanel risk={data.output.risk_assessment} />
            </div>
          </div>

          {/* CENTER PIECE: THE MAP */}
          <div className="lg:col-span-6 min-h-[700px]">
            <MapIntelligencePanel
              input={data.input}
              flags={data.output.map_visualization_flags}
            />
          </div>

          {/* RIGHT PANEL: SUMMARY & MOBILE RISK */}
          <div className="lg:col-span-3 flex flex-col gap-10">
            <div className="flex-1">
              <AIReasoningEngine input={data.input} output={data.output} />
            </div>
            <div className="lg:hidden">
              <RiskAssessmentPanel risk={data.output.risk_assessment} />
            </div>
            <div className="h-full min-h-[250px]">
              <TrafficManagementPanel
                actions={data.output.traffic_management_actions}
              />
            </div>
          </div>
        </div>

        {/* ROW 2: TACTICAL CONTROLS & PUBLIC OUTREACH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12 items-stretch">
          <div className="lg:col-span-2 flex">
            <div className="w-full">
              <SignalActionsPanel actions={data.output.signal_actions} />
            </div>
          </div>
          <div className="lg:col-span-1 flex">
            <div className="w-full">
              <AdvisoryPanel advisories={data.output.public_advisories} />
            </div>
          </div>
        </div>

        {/* FOOTNOTE / TECHNICAL META */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 pt-10 border-t border-gray-100 pb-20">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-200" />
              <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest italic">
                Live Signal Handover Sync (ICCC-ACTIVE)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 border border-gray-100 rounded-full italic">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight text-center">
              Developed for{" "}
              <span className="text-gray-900 font-black">
                PMC ATCS INITIATIVE
              </span>{" "}
              - Operational Node Shivaji-004
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
