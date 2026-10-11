"use client";

import { useEffect, useState } from "react";

export type ProgressStep = { label: string; after: number };

export default function SearchProgress({ steps, expectedSeconds }: { steps: ProgressStep[]; expectedSeconds: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
    return () => clearInterval(timer);
  }, []);

  const started = steps.filter((step) => step.after <= elapsed);
  const percent = Math.min(95, Math.round((1 - Math.exp(-elapsed / expectedSeconds)) * 100));

  return (
    <div className="space-y-3 rounded-xl bg-white/80 px-4 py-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]" role="status" aria-live="polite">
      <div className="h-1.5 overflow-hidden rounded-full bg-black/8">
        <div className="h-full rounded-full bg-[#0a84ff] transition-[width] duration-300 ease-out" style={{ width: `${Math.max(percent, 3)}%` }} />
      </div>
      <ul className="space-y-1.5 text-[13px]">
        {started.map((step, index) => {
          const current = index === started.length - 1;
          return (
            <li key={step.label} className={`flex items-center gap-2 ${current ? "text-black/80" : "text-black/40"}`}>
              {current ? (
                <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#0a84ff] border-t-transparent" aria-hidden="true" />
              ) : (
                <span className="flex h-3 w-3 shrink-0 items-center justify-center" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-black/30" />
                </span>
              )}
              {step.label}
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-black/40">{Math.floor(elapsed)} s · This can take up to a minute.</p>
    </div>
  );
}
