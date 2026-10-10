"use client";

import { useState } from "react";
import { periods } from "@/components/stats/ranges";
import TrafficSources from "@/components/stats/TrafficSources";
import { useStats } from "@/components/stats/useStats";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import type { Period } from "@/lib/stats";

export default function SeoTrackerWindow() {
  const { dragProps } = useWindow();
  const { loaded, stats } = useStats();
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="@container flex h-full flex-col bg-[#1c1c1e]/95 text-white">
      <div className="flex h-12 shrink-0 items-center px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">SEO and GEO Tracker</h1>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-1">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-white/7 p-1 text-xs" role="group" aria-label="Time range">
          {periods.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
              className={`rounded-lg px-2 py-1.5 ${period === id ? "bg-[#0a84ff] font-medium" : "text-white/70 hover:bg-white/10"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {!loaded && <p className="py-10 text-center text-sm text-white/45">Loading…</p>}
        {loaded && !stats && <p className="py-10 text-center text-sm text-white/55">Statistics are currently unavailable.</p>}
        {stats && <TrafficSources stats={stats} period={period} card="rounded-2xl bg-white/7 p-4" />}
      </div>
    </div>
  );
}
