import type { AirlineRow } from "@/lib/aviationDashboard";
import { formatMillions, formatPrice } from "./metrics";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-black/45">{label}</dt>
      <dd className="whitespace-nowrap text-right tabular-nums">{value}</dd>
    </>
  );
}

export default function AirlineDetail({ row }: { row: AirlineRow }) {
  const range = row.yearLow !== null && row.yearHigh !== null && row.priceCurrency ? `${formatPrice(row.yearLow, row.priceCurrency)} to ${formatPrice(row.yearHigh, row.priceCurrency)}` : "n/a";
  return (
    <div className="text-[12px]">
      <h3 className="text-sm font-semibold">{row.name}</h3>
      <p className="text-black/50">
        {row.ticker} on {row.exchange} · {row.country}
      </p>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
        <Fact label="Fiscal year" value={row.fiscalYear} />
        <Fact label="Revenue" value={formatMillions(row.revenue, row.currency)} />
        <Fact label={row.operatingProfitLabel} value={formatMillions(row.operatingProfit, row.currency)} />
        <Fact label={row.netProfitLabel} value={row.netProfit === null ? "n/a" : formatMillions(row.netProfit, row.currency)} />
        <Fact label="Passengers" value={`${row.passengers.toFixed(1)}m`} />
        <Fact label="Load factor" value={row.loadFactor === null ? "n/a" : `${row.loadFactor}%`} />
        <Fact label="52 week range" value={range} />
        <Fact label="Shares" value={`${row.sharesMillions.toLocaleString("en-GB")}m`} />
        <Fact label="Share count date" value={row.sharesAsOf} />
      </dl>
      {row.note && <p className="mt-2 text-black/60">{row.note}</p>}
      <a href={row.source} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-[#0a6cf0] hover:underline">
        Source: results {row.published} ↗
      </a>
    </div>
  );
}
