"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80",
        className,
      )}
      role="tablist"
      aria-label="Segmented control"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "relative z-10 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "text-white"
                : "text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50",
            )}
            onClick={() => onChange(opt.id)}
          >
            {active && (
              <motion.span
                layoutId="segmented-pill"
                className="absolute inset-0 -z-10 rounded-full bg-emerald-500"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

