"use client";

import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import StatsBody from "./StatsBody";
import { useStats } from "./useStats";

export default function StatsWindow() {
  const { dragProps } = useWindow();
  const state = useStats();

  return (
    <div className="@container flex h-full flex-col bg-[#1c1c1e]/95 text-white">
      <div className="flex h-12 shrink-0 items-center justify-between gap-4 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="text-[13px] font-semibold">Visitor statistics</h1>
        <a href="/stats" target="_blank" rel="noopener noreferrer" className="text-xs text-[#0a84ff] hover:underline">
          Open page ↗
        </a>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-1">
        {state.loaded ? (
          <StatsBody stats={state.stats} tone="window" />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-white/45">Loading…</p>
        )}
      </div>
    </div>
  );
}
