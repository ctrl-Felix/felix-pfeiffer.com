"use client";

import { useEffect, useRef, useState } from "react";
import { formatSpeed, measureDownload, measureLatency, measureUpload, type Measure } from "@/lib/speedTest";
import { trackClick } from "@/lib/track";
import { Wifi } from "./Icons";

type Props = { open: boolean; onToggle: () => void };
type Phase = "idle" | "latency" | "download" | "upload" | "done" | "error";
type Results = { latency?: number; download?: number; upload?: number };

const phaseText: Record<Phase, string> = {
  idle: "Measure your connection to the nearest Cloudflare server.",
  latency: "Measuring latency…",
  download: "Measuring download…",
  upload: "Measuring upload…",
  done: "Done.",
  error: "The test server could not be reached. Check your connection or try again.",
};

function Result({ label, value, unit, active }: { label: string; value?: string; unit: string; active: boolean }) {
  return (
    <div className={`rounded-lg bg-black/5 px-2 py-2 text-center ${active ? "ring-2 ring-[#0a84ff]" : ""}`}>
      <div className="text-[11px] text-black/50">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value ?? "–"}</div>
      <div className="text-[11px] text-black/50">{unit}</div>
    </div>
  );
}

export default function WifiMenu({ open, onToggle }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<Results>({});
  const controller = useRef<AbortController | null>(null);
  const running = phase === "latency" || phase === "download" || phase === "upload";

  useEffect(() => () => controller.current?.abort(), []);

  const start = async () => {
    trackClick("speedtest");
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const measure: Measure = { fetcher: fetch.bind(window), now: () => performance.now(), signal: abort.signal };
    setResults({});
    try {
      setPhase("latency");
      const latency = await measureLatency(measure);
      setResults({ latency });
      setPhase("download");
      const download = await measureDownload(measure, (value) => setResults((current) => ({ ...current, download: value })));
      setResults((current) => ({ ...current, download }));
      setPhase("upload");
      const upload = await measureUpload(measure, (value) => setResults((current) => ({ ...current, upload: value })));
      setResults((current) => ({ ...current, upload }));
      setPhase("done");
    } catch {
      if (!abort.signal.aborted) setPhase("error");
    }
  };

  const stop = () => {
    controller.current?.abort();
    setPhase("idle");
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Wi-Fi and speed test"
        onClick={onToggle}
        className={`flex h-6 items-center rounded-md px-1.5 ${open ? "bg-white/25" : "hover:bg-white/15"}`}
      >
        <Wifi />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Speed test"
          className="fixed inset-x-2 top-8 rounded-xl bg-[#f5f5f7]/80 p-3 sm:absolute sm:inset-x-auto sm:right-0 sm:top-7 sm:w-72 text-[13px] text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-200 [text-shadow:none]"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold">Speed test</p>
            <button
              type="button"
              onClick={running ? stop : start}
              className={`rounded-md px-2.5 py-1 text-xs font-medium text-white ${running ? "bg-black/40 hover:bg-black/50" : "bg-[#0a84ff] hover:bg-[#0a74e0]"}`}
            >
              {running ? "Stop" : phase === "idle" ? "Start" : "Run again"}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Result label="Latency" value={results.latency === undefined ? undefined : results.latency.toFixed(0)} unit="ms" active={phase === "latency"} />
            <Result label="Download" value={results.download === undefined ? undefined : formatSpeed(results.download)} unit="Mbit/s" active={phase === "download"} />
            <Result label="Upload" value={results.upload === undefined ? undefined : formatSpeed(results.upload)} unit="Mbit/s" active={phase === "upload"} />
          </div>
          <p className={`mt-2 text-xs ${phase === "error" ? "text-[#d6204a]" : "text-black/55"}`}>{phaseText[phase]}</p>
          <p className="mt-2 text-[11px] text-black/45">
            Runs in your browser against speed.cloudflare.com and transfers up to about 200 MB. Results are not stored.
          </p>
        </div>
      )}
    </div>
  );
}
