"use client";

import { useMemo } from "react";
import type { Quote } from "@/lib/stocks";
import { indices, indexSymbols } from "./indices";
import { formatPercent, formatPrice, negativeColor, positiveColor } from "./format";
import Sparkline from "./Sparkline";
import { useHeight } from "./useHeight";
import { useQuotes } from "./useQuotes";

const maxRows = 5;
const minRowHeight = 30;
const headerHeight = 44;

type Entry = { name: string; quote: Quote; percent: number };

function Table({ title, positive, entries, onSelect }: { title: string; positive: boolean; entries: Entry[]; onSelect: (symbol: string) => void }) {
  const { ref, height } = useHeight<HTMLUListElement>();
  const rows = Math.max(1, Math.min(maxRows, Math.floor(height / minRowHeight)));
  const color = positive ? positiveColor : negativeColor;

  return (
    <section className="flex min-h-0 flex-col rounded-2xl bg-white/7 px-3 pb-2 pt-3">
      <h2 className="flex items-center gap-1.5 px-1 text-[13px] font-semibold" style={{ height: headerHeight - 16 }}>
        <span style={{ color }}>{positive ? "▲" : "▼"}</span>
        {title}
      </h2>
      <ul ref={ref} className="flex min-h-0 flex-1 flex-col">
        {entries.slice(0, rows).map(({ name, quote, percent }) => (
          <li key={quote.requested} className="flex min-h-0 flex-1 border-t border-white/8">
            <button type="button" onClick={() => onSelect(quote.requested)} className="flex w-full items-center gap-2 rounded-md px-1 text-left hover:bg-white/8">
              <span className="min-w-0 flex-1 truncate text-[13px]">{name}</span>
              <span className="hidden @min-3xl:block"><Sparkline points={quote.points} positive={percent >= 0} /></span>
              <span className="w-[4.5rem] shrink-0 text-right text-[13px] tabular-nums text-white/80">{formatPrice(quote.price)}</span>
              <span className="w-[3.75rem] shrink-0 text-right text-[13px] font-medium tabular-nums" style={{ color: percent >= 0 ? positiveColor : negativeColor }}>
                {formatPercent(percent)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Markets({ onSelect }: { onSelect: (symbol: string) => void }) {
  const { quotes, loading, failed } = useQuotes(indexSymbols);

  const entries = useMemo(
    () =>
      indices
        .flatMap(({ symbol, name }) => {
          const quote = quotes[symbol];
          return quote ? [{ name, quote, percent: ((quote.price - quote.baseline) / quote.baseline) * 100 }] : [];
        })
        .sort((a, b) => b.percent - a.percent),
    [quotes],
  );

  if (!entries.length) {
    return <p className="flex flex-1 items-center justify-center text-sm text-white/45">{failed ? "Market data unavailable." : loading ? "Loading markets…" : "No data."}</p>;
  }

  const half = Math.min(maxRows, Math.floor(entries.length / 2));
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 @max-lg:grid-cols-1 @max-lg:grid-rows-2">
      <Table title="Best performing" positive entries={entries.slice(0, half)} onSelect={onSelect} />
      <Table title="Worst performing" positive={false} entries={entries.slice(-half).reverse()} onSelect={onSelect} />
    </div>
  );
}
