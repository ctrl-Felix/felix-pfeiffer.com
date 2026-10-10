"use client";

import { useEffect, useId, useState } from "react";
import type { SearchHit } from "@/lib/stocks";
import { searchStocks } from "./api";

type Props = { onPick: (hit: SearchHit) => void; placeholder?: string; className?: string };
type Result = { query: string; hits: SearchHit[]; failed: boolean };

const debounceMs = 300;
const minQueryLength = 2;

export default function SymbolSearch({ onPick, placeholder = "Search stocks, ETFs and indices", className = "" }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<Result>({ query: "", hits: [], failed: false });
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < minQueryLength) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchStocks(trimmed, controller.signal)
        .then((hits) => {
          setResult({ query: trimmed, hits, failed: false });
          setActive(0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setResult({ query: trimmed, hits: [], failed: true });
        });
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const open = focused && trimmed.length >= minQueryLength;
  const ready = result.query === trimmed;
  const hits = ready ? result.hits : [];

  const pick = (hit: SearchHit) => {
    setQuery("");
    onPick(hit);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") setQuery("");
    if (!hits.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % hits.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + hits.length) % hits.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      pick(hits[active]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={40}
        className="w-full rounded-xl bg-white/12 px-3.5 py-2 text-[13px] text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[#0a84ff]"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl bg-[#2c2c2e] py-1 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.12)]"
        >
          {!ready && <li className="px-3.5 py-2 text-xs text-white/45">Searching…</li>}
          {ready && result.failed && <li className="px-3.5 py-2 text-xs text-white/45">Search unavailable.</li>}
          {ready && !result.failed && !hits.length && <li className="px-3.5 py-2 text-xs text-white/45">No results.</li>}
          {hits.map((hit, index) => (
            <li
              key={hit.symbol}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(hit);
              }}
              className={`flex cursor-default items-baseline gap-3 px-3.5 py-1.5 ${index === active ? "bg-[#0a84ff]" : ""}`}
            >
              <span className="w-20 shrink-0 text-[13px] font-semibold">{hit.symbol}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-white/70">{hit.name}</span>
              <span className="shrink-0 text-[11px] text-white/45">{hit.exchange}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
