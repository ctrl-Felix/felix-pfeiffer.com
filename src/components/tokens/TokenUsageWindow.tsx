"use client";

import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import { formatMillions, modelName, tokenTotals } from "@/lib/tokenUsage";

const totals = tokenTotals();

export default function TokenUsageWindow() {
  const { dragProps } = useWindow();

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Token Usage</h1>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-[13px] text-black/60">Tokens Claude has used to build this page, counted from every session.</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Processed", value: formatMillions(totals.processed) },
            { label: "Written", value: formatMillions(totals.written) },
            { label: "Requests", value: totals.calls.toLocaleString("en-US") },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/80 px-2 py-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
              <div className="text-lg font-semibold">{item.value}</div>
              <div className="text-xs text-black/55">{item.label}</div>
            </div>
          ))}
        </div>
        <section>
          <h2 className="mb-2 text-sm font-semibold">By model</h2>
          {totals.models.length ? (
            <ul className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
              {totals.models.map((item) => {
                const share = totals.processed ? (item.processed / totals.processed) * 100 : 0;
                return (
                  <li key={item.model} className="px-4 py-3 text-[13px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{modelName(item.model)}</span>
                      <span className="text-black/55">{share.toFixed(share < 10 && share > 0 ? 1 : 0)}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/8">
                      <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(share, 1)}%` }} />
                    </div>
                    <div className="mt-1.5 text-xs text-black/55">
                      {formatMillions(item.processed)} processed, {formatMillions(item.written)} written, {item.calls.toLocaleString("en-US")} requests
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-4 text-center text-[13px] text-black/45">No usage recorded yet.</p>
          )}
        </section>
        <p className="text-center text-[11px] text-black/40">Processed includes cached context that is read again on every request.</p>
      </div>
    </div>
  );
}
