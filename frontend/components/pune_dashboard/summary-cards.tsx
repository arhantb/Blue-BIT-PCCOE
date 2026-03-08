import { TrendingDown, TrendingUp, AlertTriangle, Clock4 } from "lucide-react";

const summaryCards = [
  {
    id: "congestion",
    label: "Congestion level",
    value: "68%",
    chip: "Pune Metro Region",
    deltaLabel: "vs last month",
    delta: "+6%",
    positive: false,
  },
  {
    id: "incidents",
    label: "Incidents today",
    value: "14",
    chip: "Collisions & breakdowns",
    deltaLabel: "above daily baseline",
    delta: "+3",
    positive: false,
  },
  {
    id: "closures",
    label: "Active road closures",
    value: "7",
    chip: "Planned + unplanned",
    deltaLabel: "below festival peak",
    delta: "-4",
    positive: true,
  },
  {
    id: "delay",
    label: "Avg corridor delay",
    value: "9 min",
    chip: "Evening peak 6–8 PM",
    deltaLabel: "vs free‑flow",
    delta: "+3 min",
    positive: false,
  },
];

export function PuneSummaryCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon =
          card.id === "congestion"
            ? TrendingUp
            : card.id === "delay"
              ? Clock4
              : AlertTriangle;

        return (
          <article
            key={card.id}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-[0_18px_45px_rgba(15,23,42,0.6)]"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r  from-orange-400 via-white to-emerald-500" />

            <div className="flex items-start justify-between gap-3 pt-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="text-3xl font-semibold text-slate-950 dark:text-slate-50">
                  {card.value}
                </p>
                <p className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-orange-400" />
                  {card.chip}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    card.positive
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-orange-500/10 text-orange-700 dark:text-orange-300"
                  }`}
                >
                  {card.positive ? (
                    <TrendingDown className="mr-1.5 h-3 w-3" />
                  ) : (
                    <TrendingUp className="mr-1.5 h-3 w-3" />
                  )}
                  {card.delta}{" "}
                  <span className="ml-1 font-normal text-slate-600 dark:text-slate-300">
                    {card.deltaLabel}
                  </span>
                </span>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/5 text-emerald-700 dark:bg-slate-800/80 dark:text-emerald-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
