"use client";

import { useState } from "react";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import Detail from "./Detail";
import SearchResults from "./SearchResults";
import Watchlist from "./Watchlist";

const storageKey = "stocks.watchlist";
const defaultSymbols = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA", "^GSPC", "^GDAXI"];

function loadSymbols() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (Array.isArray(stored) && stored.length && stored.every((item) => typeof item === "string")) return stored as string[];
  } catch {}
  return defaultSymbols;
}

function saveSymbols(symbols: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(symbols));
  } catch {}
}

export default function StocksApp() {
  const { dragProps } = useWindow();
  const [symbols, setSymbols] = useState(loadSymbols);
  const [selected, setSelected] = useState(() => symbols[0]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;

  const select = (symbol: string) => {
    setSelected(symbol);
    setDetailOpen(true);
  };

  const add = (symbol: string) => {
    const next = [...symbols, symbol];
    setSymbols(next);
    saveSymbols(next);
    setQuery("");
    select(symbol);
  };

  const remove = (symbol: string) => {
    const next = symbols.filter((item) => item !== symbol);
    if (!next.length) return;
    setSymbols(next);
    saveSymbols(next);
    if (selected === symbol) setSelected(next[0]);
  };

  return (
    <div className="@container flex h-full bg-[#1c1c1e]/90 text-white">
      <aside className={`flex w-[320px] shrink-0 flex-col bg-black/25 @max-2xl:w-full ${detailOpen ? "@max-2xl:hidden" : ""}`}>
        <div className="flex h-12 shrink-0 items-center px-4" {...dragProps}>
          <TrafficLights />
        </div>
        <div className="px-3 pb-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stocks"
            aria-label="Search stocks"
            maxLength={40}
            className="w-full rounded-lg bg-white/12 px-3 py-1.5 text-[13px] outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#0a84ff]"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-3">
          {searching ? (
            <SearchResults query={query.trim()} watched={symbols} onSelect={select} onAdd={add} />
          ) : (
            <Watchlist symbols={symbols} selected={selected} onSelect={select} onRemove={remove} />
          )}
        </div>
      </aside>
      <section className={`flex min-w-0 flex-1 flex-col ${detailOpen ? "" : "@max-2xl:hidden"}`}>
        <div className="flex h-12 shrink-0 items-center px-4" {...dragProps}>
          <button type="button" onClick={() => setDetailOpen(false)} className="hidden text-sm text-[#0a84ff] @max-2xl:inline">
            ‹ Stocks
          </button>
        </div>
        <Detail key={selected} symbol={selected} />
      </section>
    </div>
  );
}
