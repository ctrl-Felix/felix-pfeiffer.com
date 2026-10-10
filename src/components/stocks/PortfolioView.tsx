"use client";

import { useState } from "react";
import SymbolSearch from "./SymbolSearch";
import { formatChange, formatPercent, formatPrice, negativeColor, positiveColor } from "./format";
import type { Portfolio, Position } from "./portfolios";
import { portfolioTotals } from "./totals";
import { useQuotes } from "./useQuotes";

type Props = {
  portfolio: Portfolio;
  onSelect: (symbol: string) => void;
  onAdd: (position: Position) => void;
  onRemovePosition: (symbol: string) => void;
  onDelete: () => void;
};

const tone = (value: number) => (value >= 0 ? positiveColor : negativeColor);

function AddPosition({ onAdd }: { onAdd: (position: Position) => void }) {
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [cost, setCost] = useState("");
  const amount = Number(shares);
  const valid = symbol !== "" && amount > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onAdd({ symbol, shares: amount, ...(Number(cost) > 0 ? { cost: Number(cost) } : {}) });
    setSymbol("");
    setShares("");
    setCost("");
  };

  const field = "w-20 rounded-lg bg-white/12 px-2.5 py-2 text-[13px] outline-none placeholder:text-white/35 focus:ring-2 focus:ring-[#0a84ff]";
  return (
    <form onSubmit={submit} className="flex shrink-0 items-start gap-2 pt-3">
      <div className="min-w-0 flex-1">
        <SymbolSearch onPick={(hit) => setSymbol(hit.symbol)} placeholder={symbol ? `Selected: ${symbol}` : "Add a position"} />
      </div>
      <input value={shares} onChange={(event) => setShares(event.target.value)} inputMode="decimal" placeholder="Shares" aria-label="Shares" className={field} />
      <input value={cost} onChange={(event) => setCost(event.target.value)} inputMode="decimal" placeholder="Avg cost" aria-label="Average cost" className={`${field} @max-xl:hidden`} />
      <button type="submit" disabled={!valid} className="rounded-lg bg-[#0a84ff] px-3 py-2 text-[13px] font-medium disabled:opacity-40">
        Add
      </button>
    </form>
  );
}

export default function PortfolioView({ portfolio, onSelect, onAdd, onRemovePosition, onDelete }: Props) {
  const { quotes, loading } = useQuotes(portfolio.positions.map((position) => position.symbol));
  const totals = portfolioTotals(portfolio, quotes);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-4 pb-3">
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold">{portfolio.name}</h2>
          <button type="button" onClick={onDelete} className="text-xs text-[#ff453a] hover:underline">Delete portfolio</button>
        </div>
        {totals.complete && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-semibold tabular-nums">
              {totals.currency ? formatPrice(totals.value) : "Mixed currencies"}
              {totals.currency && <span className="ml-1 text-xs font-normal text-white/50">{totals.currency}</span>}
            </p>
            <p className="text-sm font-medium tabular-nums" style={{ color: tone(totals.dayChange) }}>
              {totals.currency ? `${formatChange(totals.dayChange)} ` : ""}({formatPercent(totals.dayPercent)}) today
            </p>
            {totals.gain !== null && totals.gainPercent !== null && totals.currency && (
              <p className="text-xs tabular-nums" style={{ color: tone(totals.gain) }}>
                Total {formatChange(totals.gain)} ({formatPercent(totals.gainPercent)})
              </p>
            )}
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white/7 px-3">
        {!portfolio.positions.length && <p className="py-6 text-center text-sm text-white/45">No positions yet. Add one below.</p>}
        <table className="w-full text-[13px]">
          <tbody>
            {portfolio.positions.map((position) => {
              const quote = quotes[position.symbol];
              const percent = quote ? ((quote.price - quote.baseline) / quote.baseline) * 100 : null;
              return (
                <tr key={position.symbol} className="group border-b border-white/8 last:border-0">
                  <td className="py-2 pr-2">
                    <button type="button" onClick={() => onSelect(position.symbol)} className="block max-w-[10rem] text-left @max-xl:max-w-[6rem]">
                      <span className="block font-semibold">{position.symbol}</span>
                      <span className="block truncate text-xs text-white/50">{quote?.name ?? (loading ? "Loading…" : "Unavailable")}</span>
                    </button>
                  </td>
                  <td className="px-2 text-right tabular-nums text-white/60 @max-xl:hidden">{position.shares}</td>
                  <td className="px-2 text-right tabular-nums">{quote ? formatPrice(quote.price) : "—"}</td>
                  <td className="px-2 text-right font-medium tabular-nums" style={{ color: percent === null ? undefined : tone(percent) }}>
                    {percent === null ? "—" : formatPercent(percent)}
                  </td>
                  <td className="pl-2 text-right tabular-nums">{quote ? formatPrice(quote.price * position.shares) : "—"}</td>
                  <td className="w-6 pl-2 text-right">
                    <button type="button" aria-label={`Remove ${position.symbol}`} onClick={() => onRemovePosition(position.symbol)} className="text-white/30 hover:text-[#ff453a]">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AddPosition onAdd={onAdd} />
    </div>
  );
}
