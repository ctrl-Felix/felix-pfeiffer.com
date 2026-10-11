"use client";

import { useState } from "react";
import { fossilSources, lowCarbonSources, mixColors, mixLabels, type EnergyReport } from "@/lib/energyTypes";
import { trackClick } from "@/lib/track";
import { Battery } from "./Icons";

type Props = { open: boolean; onToggle: () => void };
type State = { status: "idle" | "loading" | "ready" | "error"; report?: EnergyReport; message?: string };

const grams = (value: number) => (value >= 10 ? value.toFixed(0) : value >= 1 ? value.toFixed(1) : value.toFixed(2));

function timezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    return "";
  }
}

async function load(params: Record<string, string>): Promise<State> {
  try {
    const response = await fetch(`/api/energy?${new URLSearchParams(params)}`);
    const body = await response.json();
    if (!response.ok) return { status: "error", message: body.error ?? "No estimate available." };
    return { status: "ready", report: body };
  } catch {
    return { status: "error", message: "No estimate available right now." };
  }
}

const monthName = (period: string) => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" });
};

const averageLabel = (report: EnergyReport) =>
  report.resolution === "live" ? "live" : report.resolution === "month" ? `monthly average ${monthName(report.period)}` : `yearly average ${report.period}`;

function Report({ report }: { report: EnergyReport }) {
  const share = (sources: string[]) => Math.round(report.mix.filter((item) => sources.includes(item.source)).reduce((sum, item) => sum + item.share, 0));
  const perWattHour = report.intensity / 1000;
  return (
    <>
      <div className="mt-3 rounded-lg bg-black/5 p-3 text-center">
        <div className="text-2xl font-semibold tabular-nums">{report.intensity} g</div>
        <div className="text-xs text-black/55">CO₂ per kWh, {averageLabel(report)}</div>
        <div className="mt-2 text-xs text-black/70">
          CO₂ per Wh: <b>{grams(perWattHour)} g</b> · Phone charge (15 Wh): <b>{grams(perWattHour * 15)} g</b> · Laptop hour: <b>{grams(perWattHour * 50)} g</b>
        </div>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-black/10">
        {report.mix.map((item) => (
          <div key={item.source} title={`${mixLabels[item.source]} ${item.share}%`} style={{ width: `${item.share}%`, background: mixColors[item.source] }} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        {report.mix.map((item) => (
          <li key={item.source} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: mixColors[item.source] }} />
            <span className="flex-1">{mixLabels[item.source]}</span>
            <span className="tabular-nums text-black/55">{item.share}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-black/60">
        Low carbon {share(lowCarbonSources)}% · Fossil {share(fossilSources)}%
      </p>
      <p className="mt-3 text-[11px] leading-snug text-black/45">
        These are estimations. Mix from {report.source}
        {report.resolution === "live" ? "" : `, a ${report.resolution === "month" ? "monthly" : "yearly"} national average`}. Grams per kWh {report.live && report.source.startsWith("Energy") ? "calculated with IPCC lifecycle medians" : "as published by the source"}. Your location is used once for this estimate and not stored.
      </p>
    </>
  );
}

export default function BatteryMenu({ open, onToggle }: Props) {
  const [state, setState] = useState<State>({ status: "idle" });

  const estimate = async (params: Record<string, string>) => {
    setState((current) => ({ ...current, status: "loading" }));
    const next = await load(params);
    setState((current) => (next.status === "error" && current.report ? { ...next, status: "ready", report: current.report } : next));
  };

  const toggle = () => {
    onToggle();
    if (!open && state.status === "idle") {
      trackClick("energy");
      estimate({ tz: timezone() });
    }
  };

  const precise = () => {
    if (!navigator.geolocation) return setState({ status: "error", message: "Your browser does not share a location." });
    setState((current) => ({ ...current, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      (position) => estimate({ tz: timezone(), lat: position.coords.latitude.toFixed(2), lon: position.coords.longitude.toFixed(2) }),
      () => setState((current) => ({ ...current, status: current.report ? "ready" : "error", message: "Location permission was not given." })),
      { maximumAge: 600_000, timeout: 15_000 },
    );
  };

  const report = state.report;
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Power mix and CO₂ at your location"
        onClick={toggle}
        className={`flex h-6 items-center rounded-md px-1.5 ${open ? "bg-white/25" : "hover:bg-white/15"}`}
      >
        <Battery />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Power mix"
          className="fixed inset-x-2 top-8 max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-xl bg-[#f5f5f7]/80 p-3 text-[13px] text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-200 [text-shadow:none] sm:absolute sm:inset-x-auto sm:right-0 sm:top-7 sm:w-80"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold">Your power mix</p>
              <p className="text-xs text-black/55">
                {report
                  ? `${report.location.region ? `${report.location.region}, ` : ""}${report.location.name} (${report.location.method === "precise" ? "precise location" : "from your time zone"})`
                  : "Where your electricity comes from"}
              </p>
            </div>
            {report?.location.method !== "precise" && (
              <button type="button" onClick={precise} disabled={state.status === "loading"} className="shrink-0 rounded-md bg-[#0a84ff] px-2 py-1 text-xs font-medium text-white hover:bg-[#0a74e0] disabled:opacity-50">
                Use precise location
              </button>
            )}
          </div>
          {state.status === "loading" && <p className="mt-3 text-xs text-black/55">Estimating…</p>}
          {state.message && state.status !== "loading" && <p className="mt-3 text-xs text-[#d6204a]">{state.message}</p>}
          {report && state.status !== "loading" && <Report report={report} />}
        </div>
      )}
    </div>
  );
}
