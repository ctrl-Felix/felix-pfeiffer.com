"use client";

import { useState } from "react";
import { formatChange, formatPercent, formatPrice, negativeColor, positiveColor } from "./format";
import type { Portfolio } from "./portfolios";
import { portfolioTotals } from "./totals";
import { useQuotes } from "./useQuotes";

function Card({ portfolio, onOpen }: { portfolio: Portfolio; onOpen: () => void }) {
  const { quotes } = useQuotes(portfolio.positions.map((position) => position.symbol));
  const totals = portfolioTotals(portfolio, quotes);
  const color = totals.dayChange >= 0 ? positiveColor : negativeColor;

  return (
    <button type="button" onClick={onOpen} className="flex flex-col justify-between rounded-2xl bg-white/7 p-4 text-left hover:bg-white/12">
      <span>
        <span className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{portfolio.name}</span>
          {portfolio.example && <span className="rounded bg-white/15 px-1.5 text-[10px] uppercase tracking-wide text-white/60">Example</span>}
        </span>
        <span className="text-xs text-white/50">{portfolio.positions.length} positions</span>
      </span>
      {totals.complete ? (
        <span>
          <span className="block text-xl font-semibold tabular-nums">
            {totals.currency ? formatPrice(totals.value) : "Mixed currencies"}
            {totals.currency && <span className="ml-1 text-xs font-normal text-white/50">{totals.currency}</span>}
          </span>
          <span className="text-xs font-medium tabular-nums" style={{ color }}>
            {totals.currency ? `${formatChange(totals.dayChange)} ` : ""}({formatPercent(totals.dayPercent)}) today
          </span>
        </span>
      ) : (
        <span className="text-xs text-white/40">{portfolio.positions.length ? "Loading…" : "Empty"}</span>
      )}
    </button>
  );
}

type Props = { portfolios: Portfolio[]; onOpen: (id: string) => void; onCreate: (name: string) => string };

export default function PortfolioList({ portfolios, onOpen, onCreate }: Props) {
  const [name, setName] = useState("");

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setName("");
    onOpen(onCreate(trimmed));
  };

  return (
    <div className="grid min-h-0 flex-1 auto-rows-[8rem] content-start grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3 overflow-y-auto">
      {portfolios.map((portfolio) => (
        <Card key={portfolio.id} portfolio={portfolio} onOpen={() => onOpen(portfolio.id)} />
      ))}
      <form onSubmit={create} className="flex flex-col justify-center gap-2 rounded-2xl border border-dashed border-white/20 p-4">
        <label htmlFor="new-portfolio" className="text-xs text-white/50">New portfolio</label>
        <input
          id="new-portfolio"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={30}
          placeholder="Name"
          className="rounded-lg bg-white/12 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-white/35 focus:ring-2 focus:ring-[#0a84ff]"
        />
        <button type="submit" className="rounded-lg bg-[#0a84ff] py-1 text-xs font-medium disabled:opacity-40" disabled={!name.trim()}>
          Create
        </button>
      </form>
    </div>
  );
}
