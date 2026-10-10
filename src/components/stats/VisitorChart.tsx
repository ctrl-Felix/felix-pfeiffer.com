"use client";

import { useState } from "react";
import type { Bar } from "./ranges";

export default function VisitorChart({ bars, total, caption }: { bars: Bar[]; total: number; caption: string }) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const selected = bars.find((bar) => bar.key === active);
  const dense = bars.length > 14;

  return (
    <div onPointerLeave={() => setActive(null)}>
      <p className="text-xs font-medium uppercase tracking-wide text-white/55">{selected ? selected.label : caption}</p>
      <p className="mb-4 text-3xl font-semibold tabular-nums">
        {(selected ? selected.value : total).toLocaleString("en-US")}
        <span className="ml-2 text-sm font-normal text-white/55">visitors</span>
      </p>
      <div className="flex h-44 items-end gap-[3px]" role="img" aria-label={`Visitors per ${bars.length > 12 ? "day" : "period"}, ${caption}`}>
        {bars.map((bar) => (
          <div
            key={bar.key}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            onPointerEnter={() => setActive(bar.key)}
            onPointerDown={() => setActive(bar.key)}
          >
            <div
              className={`w-full rounded-t-[5px] transition-colors ${active === null || active === bar.key ? "bg-[#0a84ff]" : "bg-[#0a84ff]/35"}`}
              style={{ height: `${Math.max((bar.value / max) * 100, bar.value ? 3 : 1.5)}%`, opacity: bar.value ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px] text-[10px] text-white/45" aria-hidden>
        {bars.map((bar, index) => (
          <span key={bar.key} className="min-w-0 flex-1 text-center">
            {!dense || index % 5 === 0 ? bar.short : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Visitors, {caption}</caption>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.key}>
              <th>{bar.label}</th>
              <td>{bar.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
