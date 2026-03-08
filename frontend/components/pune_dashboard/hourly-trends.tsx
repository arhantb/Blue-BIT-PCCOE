"use client";

import { useMemo, useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";

type Mode = "weekdays" | "weekends" | "all";

const options = [
  { id: "weekdays", label: "Weekdays" },
  { id: "weekends", label: "Weekends" },
  { id: "all", label: "All" },
] as const satisfies { id: Mode; label: string }[];

const hourly = {
  weekdays: [
    0.12, 0.1, 0.09, 0.09, 0.12, 0.22, 0.35, 0.48, 0.72, 0.6, 0.42, 0.36,
    0.32, 0.3, 0.34, 0.44, 0.62, 0.78, 0.83, 0.66, 0.48, 0.34, 0.22, 0.16,
  ],
  weekends: [
    0.14, 0.12, 0.11, 0.1, 0.12, 0.18, 0.26, 0.34, 0.45, 0.52, 0.58, 0.62,
    0.66, 0.6, 0.52, 0.46, 0.44, 0.5, 0.56, 0.52, 0.4, 0.3, 0.22, 0.18,
  ],
  all: [
    0.13, 0.11, 0.1, 0.095, 0.12, 0.2, 0.31, 0.43, 0.64, 0.56, 0.46, 0.4,
    0.38, 0.34, 0.37, 0.45, 0.59, 0.72, 0.78, 0.62, 0.46, 0.33, 0.23, 0.17,
  ],
} as const satisfies Record<Mode, number[]>;

function rgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hourLabel(h: number) {
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}${ampm}`;
}

export function PuneHourlyTrends() {
  const [mode, setMode] = useState<Mode>("weekdays");

  const { peakText } = useMemo(() => {
    const arr = hourly[mode];
    const peakHour = arr.reduce(
      (best, v, i) => (v > best.v ? { i, v } : best),
      { i: 0, v: arr[0] ?? 0 },
    ).i;

    const start = Math.max(0, peakHour - 1);
    const end = Math.min(23, peakHour + 2);

    return {
      peakText: `${hourLabel(start)}–${hourLabel(end)}`,
    };
  }, [mode]);

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(15,23,42,0.6)]">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Hourly congestion trends
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Density by hour (sample heat)
          </p>
        </div>
        <SegmentedControl options={[...options]} value={mode} onChange={setMode} />
      </header>

      <div className="mt-1 grid grid-cols-[repeat(24,minmax(0,1fr))] gap-1">
        {hourly[mode].map((v, i) => {
          const base = rgba("#0ea5e9", 0.1);
          const hot = rgba("#34d399", 0.18 + v * 0.55);
          const edge = rgba("#fb923c", 0.12 + v * 0.35);

          return (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-28 w-full rounded-md border border-slate-200 dark:border-slate-800",
                  "shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.35)]",
                )}
                style={{
                  background: `linear-gradient(180deg, ${hot} 0%, ${edge} 55%, ${base} 100%)`,
                  opacity: 0.85,
                }}
                title={`${hourLabel(i)} — ${(v * 100).toFixed(0)}%`}
              />
              {(i % 4 === 0 || i === 23) && (
                <span className="text-[10px] text-slate-500">
                  {hourLabel(i)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Peak rush hour occurred from{" "}
        <span className="font-semibold text-orange-600 dark:text-orange-300">
          {peakText}
        </span>
        .
      </p>
    </section>
  );
}

