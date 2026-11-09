import type { AirlineRow } from "@/lib/aviationDashboard";
import { formatEurMillions, formatPercent } from "./metrics";

const sum = (values: (number | null)[]) => values.reduce<number>((total, value) => total + (value ?? 0), 0);

export default function SectorSummary({ rows }: { rows: AirlineRow[] }) {
  const revenue = sum(rows.map((row) => row.revenueEur));
  const operatingProfit = sum(rows.map((row) => row.operatingProfitEur));
  const marketCap = sum(rows.map((row) => row.marketCapEur));
  const best = [...rows].sort((a, b) => b.operatingMargin - a.operatingMargin)[0];
  const tiles = [
    { label: "Combined revenue", value: formatEurMillions(revenue) },
    { label: "Sector operating margin", value: revenue ? formatPercent((operatingProfit / revenue) * 100) : "n/a" },
    { label: "Best operating margin", value: best ? `${best.name} ${formatPercent(best.operatingMargin)}` : "n/a" },
    { label: "Combined market cap", value: marketCap ? formatEurMillions(marketCap) : "n/a" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 @2xl:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl bg-white/85 px-3 py-2.5 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
          <div className="truncate text-[15px] font-semibold tabular-nums">{tile.value}</div>
          <div className="text-[11px] text-black/50">{tile.label}</div>
        </div>
      ))}
    </div>
  );
}
