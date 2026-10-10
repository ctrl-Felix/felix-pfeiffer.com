"use client";

import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";

export default function SeoTrackerWindow() {
  const { dragProps } = useWindow();

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">SEO Tracker</h1>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <p className="text-2xl font-semibold text-black/40">TBD</p>
      </div>
    </div>
  );
}
