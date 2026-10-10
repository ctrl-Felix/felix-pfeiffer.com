"use client";

import type { RangeKey } from "@/lib/stocks";
import { formatPercent, formatPrice, negativeColor, positiveColor } from "./format";
import Sparkline from "./Sparkline";
import { useChart } from "./useChart";

const dayRange: RangeKey = "1D";

type RowProps = { symbol: string; selected: boolean; onSelect: () => void; onRemove: () => void };

function Row({ symbol, selected, onSelect, onRemove }: RowProps) {
  const { data, failed } = useChart(symbol, dayRange);
  const change = data ? data.price - data.baseline : 0;
  const positive = change >= 0;
  const color = positive ? positiveColor : negativeColor;

  return (
    <li className={`group relative rounded-xl ${selected ? "bg-white/15" : "hover:bg-white/8"}`}>
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-2 px-3 py-2 text-left">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{symbol}</span>
          <span className="block truncate text-xs text-white/50">{data?.name ?? (failed ? "Unavailable" : "Loading…")}</span>
        </span>
        {data && <Sparkline points={data.points} positive={positive} />}
        <span className="w-[4.5rem] shrink-0 text-right">
          <span className="block text-[15px] tabular-nums">{data ? formatPrice(data.price) : "—"}</span>
          {data && (
            <span className="mt-0.5 inline-block rounded-md px-1.5 text-xs font-medium tabular-nums text-black" style={{ background: color }}>
              {formatPercent((change / data.baseline) * 100)}
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Remove ${symbol}`}
        onClick={onRemove}
        className="absolute -left-1 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full bg-[#ff453a] text-[11px] leading-none text-white group-hover:flex"
      >
        −
      </button>
    </li>
  );
}

type Props = { symbols: string[]; selected: string; onSelect: (symbol: string) => void; onRemove: (symbol: string) => void };

export default function Watchlist({ symbols, selected, onSelect, onRemove }: Props) {
  return (
    <ul className="space-y-0.5 px-2">
      {symbols.map((symbol) => (
        <Row key={symbol} symbol={symbol} selected={symbol === selected} onSelect={() => onSelect(symbol)} onRemove={() => onRemove(symbol)} />
      ))}
    </ul>
  );
}
