"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CorridorType = "highways" | "nonHighways" | "all";

interface Corridor {
  id: string;
  name: string;
  type: CorridorType;
  congestion: number;
  change: number;
}

const corridors: Corridor[] = [
  {
    id: "mumbai-pune",
    name: "Mumbai–Pune Expressway",
    type: "highways",
    congestion: 82,
    change: 5,
  },
  {
    id: "nh60",
    name: "NH 60 – Nashik Phata",
    type: "highways",
    congestion: 76,
    change: 3,
  },
  {
    id: "solapur-rd",
    name: "Solapur Rd – Hadapsar",
    type: "highways",
    congestion: 69,
    change: -2,
  },
  {
    id: "hbk",
    name: "Hinjewadi Phase 1–3",
    type: "nonHighways",
    congestion: 88,
    change: 7,
  },
  {
    id: "sb-road",
    name: "SB Road – University Circle",
    type: "nonHighways",
    congestion: 73,
    change: 1,
  },
  {
    id: "fc-road",
    name: "FC Road – JM Road Loop",
    type: "nonHighways",
    congestion: 64,
    change: -3,
  },
  {
    id: "kothrud",
    name: "Kothrud Depot – Paud Rd",
    type: "nonHighways",
    congestion: 59,
    change: -1,
  },
];

const filters: { id: CorridorType; label: string }[] = [
  { id: "highways", label: "Highways" },
  { id: "nonHighways", label: "Non‑Highways" },
  { id: "all", label: "All Arterials" },
];

export function PuneCongestedArterials() {
  const [filter, setFilter] = useState<CorridorType>("highways");

  const visible = corridors
    .filter((c) => (filter === "all" ? true : c.type === filter))
    .sort((a, b) => b.congestion - a.congestion)
    .slice(0, 6);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(15,23,42,0.6)]">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Most congested corridors
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Live density index across key Pune arterials
          </p>
        </div>
        <div className="inline-flex items-center rounded-full bg-slate-900/5 p-1 text-xs dark:bg-slate-800/80">
          {filters.map((f) => (
            <button
              key={f.id}
              className={cn(
                "rounded-full px-3 py-1 font-medium transition-colors",
                filter === f.id
                  ? "bg-emerald-500 text-white"
                  : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50",
              )}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-3 overflow-y-auto pr-1">
        {visible.map((corridor) => {
          const isHeavy = corridor.congestion >= 80;
          const barColor = isHeavy
            ? "from-orange-400 via-red-500 to-orange-500"
            : "from-emerald-400 via-emerald-500 to-orange-400";

          return (
            <article
              key={corridor.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/90"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-50">
                    {corridor.name}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {corridor.type === "highways"
                      ? "National / expressway corridor"
                      : "Urban arterial / major city road"}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                    {corridor.congestion}%
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      corridor.change >= 0
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {corridor.change >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(corridor.change)} pts
                  </p>
                </div>
              </div>

              <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-2 rounded-full bg-gradient-to-r",
                    barColor,
                  )}
                  style={{ width: `${corridor.congestion}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

