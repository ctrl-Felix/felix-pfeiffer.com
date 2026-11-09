"use client";

import { useState } from "react";
import { aviationSector } from "@/data/aviation";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import AviationDashboard from "./AviationDashboard";
import SectorPicker from "./SectorPicker";
import { useAviation } from "./useAviation";

function AviationView() {
  const state = useAviation();
  if (state.kind === "loading") return <p className="py-8 text-center text-sm text-black/45">Loading…</p>;
  if (state.kind === "error") return <p className="py-8 text-center text-sm text-[#c4281e]">The data could not be loaded.</p>;
  return <AviationDashboard data={state.data} />;
}

export default function AnalystWindow() {
  const { dragProps } = useWindow();
  const [sector, setSector] = useState<string | null>(null);

  return (
    <div className="@container flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-black/10 px-4" {...dragProps}>
        <div className="flex items-center gap-3">
          <TrafficLights />
          {sector && (
            <button type="button" onClick={() => setSector(null)} className="rounded-md px-1.5 py-0.5 text-[13px] text-[#0a6cf0] hover:bg-black/5">
              ‹ Sectors
            </button>
          )}
        </div>
        <h1 className="text-[13px] font-semibold">{sector === aviationSector.id ? "European Airlines" : "Financial Analyst"}</h1>
        <span />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{sector === aviationSector.id ? <AviationView /> : <SectorPicker onPick={setSector} />}</div>
    </div>
  );
}
