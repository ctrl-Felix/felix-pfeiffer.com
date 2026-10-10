"use client";

import { useState } from "react";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import { matchTools, tools } from "./registry";

export default function ToolsApp() {
  const { dragProps } = useWindow();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = tools.find((tool) => tool.id === activeId);
  const matches = matchTools(query);

  return (
    <div className="@container flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        {active ? (
          <>
            <button type="button" onClick={() => setActiveId(null)} className="text-sm text-[#0a84ff]">‹ Tools</button>
            <h1 className="flex-1 pr-24 text-center text-[13px] font-semibold">{active.name}</h1>
          </>
        ) : (
          <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Tools</h1>
        )}
      </div>
      {active ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <active.Component />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools"
            aria-label="Search tools"
            maxLength={40}
            className="rounded-lg bg-black/6 px-3 py-2 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]"
          />
          {matches.length ? (
            <ul className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 content-start gap-3 overflow-y-auto @lg:grid-cols-2">
              {matches.map((tool) => (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(tool.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
                  >
                    <span className="block h-11 w-11 shrink-0"><tool.Icon /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{tool.name}</span>
                      <span className="block text-xs text-black/55">{tool.description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-black/40">No tools match &quot;{query}&quot;.</p>
          )}
        </div>
      )}
    </div>
  );
}
