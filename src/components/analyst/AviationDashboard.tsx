"use client";

import { useState } from "react";
import type { AviationDashboard as Dashboard } from "@/lib/aviationDashboard";
import AirlineDetail from "./AirlineDetail";
import KpiTable from "./KpiTable";
import { metrics, type MetricId } from "./metrics";
import RankingChart from "./RankingChart";
import SectorSummary from "./SectorSummary";

const card = "rounded-xl bg-[#fbfbfd] p-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]";
const heading = "mb-2 text-xs font-medium uppercase tracking-wide text-black/45";

function Footnote({ data }: { data: Dashboard }) {
  const time = new Date(data.generated).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
  return (
    <p className="text-center text-[11px] leading-relaxed text-black/40">
      Annual figures from each company&apos;s latest full-year results; profit measures follow each company&apos;s own definition. Amounts in EUR at{" "}
      {data.fx.live ? "current" : "approximate"} rates (1 EUR = {data.fx.GBP.toFixed(4)} GBP, {data.fx.NOK.toFixed(3)} NOK).{" "}
      {data.pricesLive ? `Share prices from Yahoo Finance, delayed, loaded ${time}.` : "Share prices are unavailable right now."} Not investment advice.
    </p>
  );
}

export default function AviationDashboard({ data }: { data: Dashboard }) {
  const [metricId, setMetricId] = useState<MetricId>("operatingMargin");
  const [selected, setSelected] = useState<string | null>(null);
  const metric = metrics.find((item) => item.id === metricId) ?? metrics[0];
  const selectedRow = data.rows.find((row) => row.id === selected);
  const toggle = (id: string) => setSelected((current) => (current === id ? null : id));

  return (
    <div className="space-y-3">
      <SectorSummary rows={data.rows} />
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Metric">
        {metrics.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === metric.id}
            onClick={() => setMetricId(item.id)}
            className={`rounded-full px-2.5 py-1 text-[12px] ${item.id === metric.id ? "bg-[#0a6cf0] text-white" : "bg-black/5 text-black/70 hover:bg-black/10"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 @2xl:grid-cols-[1fr_19rem]">
        <section className={card}>
          <h2 className={heading}>
            {metric.label}
            {metric.lowerIsBetter ? ", lowest first" : ""}
          </h2>
          {metric.live && !data.pricesLive ? (
            <p className="py-6 text-center text-[13px] text-black/45">Needs share prices, which are unavailable right now.</p>
          ) : (
            <RankingChart rows={data.rows} metric={metric} selected={selected} onSelect={toggle} />
          )}
        </section>
        <section className={card}>
          <h2 className={heading}>Details</h2>
          {selectedRow ? <AirlineDetail row={selectedRow} /> : <p className="text-[12px] text-black/45">Select an airline for its reported figures and source.</p>}
        </section>
      </div>
      <section className={card}>
        <h2 className={heading}>All KPIs</h2>
        <KpiTable rows={data.rows} metric={metric} onMetric={setMetricId} selected={selected} onSelect={toggle} />
      </section>
      <Footnote data={data} />
    </div>
  );
}
