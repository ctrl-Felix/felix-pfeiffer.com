import type { AirlineRow } from "@/lib/aviationDashboard";
import { ranked, type Metric } from "./metrics";

export default function RankingChart({ rows, metric, selected, onSelect }: { rows: AirlineRow[]; metric: Metric; selected: string | null; onSelect: (id: string) => void }) {
  const list = ranked(rows, metric);
  const values = list.map((row) => metric.value(row)).filter((value): value is number => value !== null);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const span = high - low || 1;
  const zero = ((0 - low) / span) * 100;

  return (
    <ul className="space-y-1.5" aria-label={`${metric.label} by airline`}>
      {list.map((row) => {
        const value = metric.value(row);
        const left = value === null ? zero : ((Math.min(value, 0) - low) / span) * 100;
        const width = value === null ? 0 : (Math.abs(value) / span) * 100;
        return (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              title={value === null ? `${row.name}: not available` : `${row.name}: ${metric.format(value)}`}
              className={`grid w-full grid-cols-[7.5rem_1fr_4.5rem] items-center gap-2 rounded-md px-1.5 py-0.5 text-left text-[12px] hover:bg-black/5 ${selected === row.id ? "bg-[#0a84ff]/10" : ""}`}
            >
              <span className="truncate font-medium">{row.name}</span>
              <span className="relative h-3.5">
                {low < 0 && <span className="absolute inset-y-0 w-px bg-black/25" style={{ left: `${zero}%` }} />}
                {value !== null && (
                  <span
                    className={`absolute inset-y-0 ${value < 0 ? "rounded-l bg-[#e8590c]" : "rounded-r bg-[#0a6cf0]"}`}
                    style={{ left: `${left}%`, width: `max(${width}%, 2px)` }}
                  />
                )}
              </span>
              <span className="text-right tabular-nums text-black/70">{value === null ? "n/a" : metric.format(value)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
