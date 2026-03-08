"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const locations = [
  "Pune City",
  "Pimpri‑Chinchwad",
  "Pune Metro Region",
  "Hinjewadi IT Park",
  "Hadapsar Corridor",
];

const reportingPeriods = ["Last Two Weeks", "Last 30 Days", "Last Quarter"];
const comparisonPeriods = ["Baseline", "Previous Period", "Same Period (YoY)"];

function Select({
  value,
  onChange,
  options,
  label,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {icon}
          </span>
        ) : null}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-950 outline-none backdrop-blur",
            "focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20",
            "dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-50 dark:focus:border-emerald-400/60 dark:focus:ring-emerald-400/20",
            icon ? "pl-10 pr-9" : "pl-3 pr-9",
          )}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
      </div>
    </label>
  );
}

export function PuneDashboardHeader({
  location,
  setLocation,
  reportingPeriod,
  setReportingPeriod,
  comparisonPeriod,
  setComparisonPeriod,
}: {
  location: string;
  setLocation: (v: string) => void;
  reportingPeriod: string;
  setReportingPeriod: (v: string) => void;
  comparisonPeriod: string;
  setComparisonPeriod: (v: string) => void;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/70 px-5 py-5 backdrop-blur md:flex-row md:items-start md:justify-between dark:border-slate-800 dark:bg-slate-950/60">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          Dashboard
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={location}
            onChange={setLocation}
            options={locations}
            label="Region"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          value={reportingPeriod}
          onChange={setReportingPeriod}
          options={reportingPeriods}
          label="Reporting Period"
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <Select
          value={comparisonPeriod}
          onChange={setComparisonPeriod}
          options={comparisonPeriods}
          label="Comparison Period"
          icon={<CalendarDays className="h-4 w-4" />}
        />
      </div>
    </header>
  );
}

