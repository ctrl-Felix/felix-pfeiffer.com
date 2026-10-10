"use client";

import { useState } from "react";
import coverage from "@/data/tldCoverage.json";

type Filter = "all" | "supported" | "missing";

const entries = Object.entries(coverage as Record<string, boolean>);
const supportedCount = entries.filter(([, supported]) => supported).length;
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "supported", label: "Supported" },
  { id: "missing", label: "Not supported" },
];

export default function TldCoverage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  if (!entries.length) {
    return <p className="py-6 text-center text-[13px] text-black/45">The TLD list has not been generated yet.</p>;
  }

  const needle = query.trim().toLowerCase().replace(/^\./, "");
  const visible = entries.filter(([tld, supported]) => {
    if (filter === "supported" && !supported) return false;
    if (filter === "missing" && supported) return false;
    return !needle || tld.includes(needle);
  });

  return (
    <div className="panel-fade space-y-3">
      <p className="text-[13px] text-black/60">
        {supportedCount} of {entries.length} top level domains are supported ({Math.round((supportedCount / entries.length) * 100)}%). Updated automatically from the IANA list.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search TLD"
          aria-label="Search TLD"
          maxLength={63}
          className="min-w-0 flex-1 rounded-lg bg-black/6 px-3 py-1.5 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]"
        />
        <div className="flex rounded-lg bg-black/6 p-0.5 text-xs">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-md px-2.5 py-1 ${filter === item.id ? "bg-white font-medium shadow-sm" : "text-black/60"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {visible.map(([tld, supported]) => (
          <li
            key={tld}
            className={`rounded-md px-1.5 py-0.5 text-xs ${supported ? "bg-[#30b050]/15 text-[#1f7a35]" : "bg-[#ff3b30]/10 text-[#c4281e]"}`}
            title={supported ? "Supported" : "Not supported"}
          >
            .{tld}
          </li>
        ))}
      </ul>
      {!visible.length && <p className="py-4 text-center text-[13px] text-black/40">No TLD matches.</p>}
    </div>
  );
}
