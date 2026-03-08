"use client";

import { useMemo, useState } from "react";
import Navbar from "@/components/navbar";
import { PuneDashboardHeader } from "@/components/pune_dashboard/header";
import { PuneSummaryCards } from "@/components/pune_dashboard/summary-cards";
import { PuneCongestedArterials } from "@/components/pune_dashboard/congested-arterials";
import { PuneHotspotsMap } from "@/components/pune_dashboard/hotspots-map";
import { PuneDailyTrends } from "@/components/pune_dashboard/daily-trends";
import { PuneHourlyTrends } from "@/components/pune_dashboard/hourly-trends";
import { Sidebar } from "../ui/sidebar";

export function PuneDashboard() {
  const [location, setLocation] = useState("Pune Metro Region");
  const [reportingPeriod, setReportingPeriod] = useState("Last Two Weeks");
  const [comparisonPeriod, setComparisonPeriod] = useState("Baseline");

  const subtitle = useMemo(() => {
    return `${location} • ${reportingPeriod} vs ${comparisonPeriod}`;
  }, [location, reportingPeriod, comparisonPeriod]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <Navbar />
      <div className="pt-20">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <PuneDashboardHeader
            location={location}
            setLocation={setLocation}
            reportingPeriod={reportingPeriod}
            setReportingPeriod={setReportingPeriod}
            comparisonPeriod={comparisonPeriod}
            setComparisonPeriod={setComparisonPeriod}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {subtitle}
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Green: improved flow
              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-orange-400" />
              Orange: increased pressure
            </div>
          </div>

          <div className="mt-5">
            <PuneSummaryCards />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <PuneCongestedArterials />
            <PuneHotspotsMap />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <PuneDailyTrends />
            <PuneHourlyTrends />
          </div>

          <div className="pb-10" />
        </div>
      </div>
    </div>
  );
}
