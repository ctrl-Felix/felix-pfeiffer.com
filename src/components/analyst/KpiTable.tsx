import type { AirlineRow } from "@/lib/aviationDashboard";
import { formatPrice, formatSigned, metrics, ranked, type Metric, type MetricId } from "./metrics";
import Sparkline from "./Sparkline";

const changeTone = (value: number | null) => (value === null ? "text-black/35" : value >= 0 ? "text-[#0a7d3b]" : "text-[#c4281e]");

export default function KpiTable({ rows, metric, onMetric, selected, onSelect }: { rows: AirlineRow[]; metric: Metric; onMetric: (id: MetricId) => void; selected: string | null; onSelect: (id: string) => void }) {
  const list = ranked(rows, metric);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-[12px]">
        <thead>
          <tr className="text-left text-[11px] text-black/50">
            <th className="sticky left-0 bg-[#fbfbfd] px-2 py-1.5 font-medium">Airline</th>
            <th className="px-2 py-1.5 text-right font-medium">Price</th>
            <th className="px-2 py-1.5 text-right font-medium">1D</th>
            <th className="px-2 py-1.5 font-medium">1Y trend</th>
            {metrics.map((item) => (
              <th key={item.id} className="px-2 py-1.5 text-right font-medium">
                <button type="button" onClick={() => onMetric(item.id)} className={`whitespace-nowrap hover:text-black ${item.id === metric.id ? "font-semibold text-[#0a6cf0]" : ""}`}>
                  {item.short}
                  {item.id === metric.id ? (item.lowerIsBetter ? " ▲" : " ▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.id} onClick={() => onSelect(row.id)} className={`cursor-default border-t border-black/8 ${selected === row.id ? "bg-[#0a84ff]/10" : "hover:bg-black/4"}`}>
              <th scope="row" className="sticky left-0 bg-[#fbfbfd] px-2 py-1.5 text-left font-medium">
                <span className="block whitespace-nowrap">{row.name}</span>
                <span className="block text-[10px] font-normal text-black/45">{row.ticker} · {row.model}</span>
              </th>
              <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">{row.price !== null && row.priceCurrency ? formatPrice(row.price, row.priceCurrency) : "–"}</td>
              <td className={`px-2 py-1.5 text-right tabular-nums ${changeTone(row.dayChange)}`}>{row.dayChange === null ? "–" : formatSigned(row.dayChange)}</td>
              <td className="px-2 py-1.5">
                <Sparkline values={row.history} />
              </td>
              {metrics.map((item) => {
                const value = item.value(row);
                return (
                  <td key={item.id} className={`whitespace-nowrap px-2 py-1.5 text-right tabular-nums ${item.id === "yearChange" ? changeTone(value) : ""} ${item.id === metric.id ? "font-semibold" : ""}`}>
                    {value === null ? <span className="text-black/35">n/a</span> : item.format(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
