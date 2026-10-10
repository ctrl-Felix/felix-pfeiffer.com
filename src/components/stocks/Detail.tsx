"use client";

import { useState } from "react";
import { rangeKeys, type ChartData, type RangeKey } from "@/lib/stocks";
import { formatChange, formatPercent, formatPrice, formatTime, formatVolume, negativeColor, positiveColor } from "./format";
import PriceChart from "./PriceChart";
import { useChart } from "./useChart";

function range(low: number | null, high: number | null) {
  return low === null || high === null ? "—" : `${formatPrice(low)} – ${formatPrice(high)}`;
}

function stats(data: ChartData) {
  return [
    ["Previous close", data.previousClose === null ? "—" : formatPrice(data.previousClose)],
    ["Day range", range(data.dayLow, data.dayHigh)],
    ["52-week range", range(data.yearLow, data.yearHigh)],
    ["Volume", data.volume === null ? "—" : formatVolume(data.volume)],
    ["Currency", data.currency || "—"],
    ["Exchange", data.exchange || "—"],
  ];
}

export default function Detail({ symbol }: { symbol: string }) {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("1D");
  const [hover, setHover] = useState<number | null>(null);
  const { data, loading, failed } = useChart(symbol, selectedRange);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-white/45">
        {failed ? "Quote unavailable." : "Loading…"}
      </div>
    );
  }

  const point = hover === null ? null : data.points[Math.min(hover, data.points.length - 1)];
  const shownPrice = point ? point[1] : data.price;
  const change = shownPrice - data.baseline;
  const positive = change >= 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold">{data.name}</h2>
          <p className="text-xs text-white/50">{data.symbol} · {data.exchange}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-3xl font-semibold tabular-nums">{formatPrice(shownPrice)}</p>
          <p className="text-sm font-medium tabular-nums" style={{ color: positive ? positiveColor : negativeColor }}>
            {formatChange(change)} ({formatPercent((change / data.baseline) * 100)})
          </p>
          <p className="h-4 text-[11px] text-white/45">{point ? formatTime(point[0], selectedRange) : ""}</p>
        </div>
      </div>
      <div className="my-3 flex gap-1 rounded-lg bg-white/10 p-0.5 text-xs font-medium">
        {rangeKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedRange(key)}
            className={`flex-1 rounded-md py-1 ${key === selectedRange ? "bg-white/20 text-white" : "text-white/60 hover:text-white"}`}
          >
            {key}
          </button>
        ))}
      </div>
      <div className={`min-h-0 flex-1 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <PriceChart
          points={data.points}
          baseline={data.baseline}
          showBaseline={selectedRange === "1D"}
          positive={positive}
          hover={hover}
          onHover={setHover}
        />
      </div>
      <dl className="mt-3 grid shrink-0 grid-cols-2 gap-x-6 text-[13px] @max-xl:grid-cols-1">
        {stats(data).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-t border-white/10 py-1.5">
            <dt className="text-white/50">{label}</dt>
            <dd className="truncate tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-1 text-[10px] text-white/35">Market data by Twelve Data, may be delayed. Not financial advice.</p>
    </div>
  );
}
