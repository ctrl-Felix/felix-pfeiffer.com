"use client";

import { useEffect, useState } from "react";
import type { SearchHit } from "@/lib/stocks";
import { searchStocks } from "./api";

type Props = { query: string; watched: string[]; onSelect: (symbol: string) => void; onAdd: (symbol: string) => void };
type Result = { query: string; hits: SearchHit[]; failed?: boolean };

const debounceMs = 250;

export default function SearchResults({ query, watched, onSelect, onAdd }: Props) {
  const [result, setResult] = useState<Result>({ query: "", hits: [] });

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchStocks(query, controller.signal)
        .then((hits) => setResult({ query, hits }))
        .catch(() => {
          if (!controller.signal.aborted) setResult({ query, hits: [], failed: true });
        });
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (result.query !== query) return <p className="px-4 py-3 text-xs text-white/45">Searching…</p>;
  if (result.failed) return <p className="px-4 py-3 text-xs text-white/45">Search unavailable.</p>;
  if (!result.hits.length) return <p className="px-4 py-3 text-xs text-white/45">No results.</p>;

  return (
    <ul className="px-2">
      {result.hits.map((hit) => (
        <li key={hit.symbol} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/8">
          <button type="button" onClick={() => onSelect(hit.symbol)} className="min-w-0 flex-1 text-left">
            <span className="block text-[15px] font-semibold">{hit.symbol}</span>
            <span className="block truncate text-xs text-white/50">{hit.name} · {hit.exchange}</span>
          </button>
          {watched.includes(hit.symbol) ? (
            <span className="text-xs text-white/40">Added</span>
          ) : (
            <button type="button" onClick={() => onAdd(hit.symbol)} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium hover:bg-white/25">
              Add
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
