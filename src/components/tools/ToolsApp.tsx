"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { peekPendingLaunch, setPendingLaunch } from "@/components/deepLink";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import { matchTools, tools } from "./registry";
import { ToolNavigationContext } from "./toolNavigation";

type Entry = { key: number; toolId: string; value?: string };

const maxDepth = 10;
let nextKey = 1;

export default function ToolsApp() {
  const { dragProps } = useWindow();
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState<Entry[]>(() => {
    const toolId = peekPendingLaunch()?.toolId;
    return toolId && tools.some((tool) => tool.id === toolId) ? [{ key: 0, toolId }] : [];
  });

  useEffect(() => {
    setPendingLaunch(undefined);
  }, []);

  const push = useCallback((toolId: string, value?: string) => {
    if (!tools.some((tool) => tool.id === toolId)) return;
    setStack((current) => [...current, { key: nextKey++, toolId, value }].slice(-maxDepth));
  }, []);
  const back = () => setStack((current) => current.slice(0, -1));
  const navigation = useMemo(() => ({ openTool: push }), [push]);

  const nameOf = (toolId: string) => tools.find((tool) => tool.id === toolId)?.name;
  const top = stack[stack.length - 1];
  const previous = stack[stack.length - 2];
  const matches = matchTools(query);

  return (
    <div className="@container flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center gap-4 border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        {top ? (
          <>
            <button type="button" onClick={back} className="max-w-[40%] truncate text-sm text-[#0a84ff]">‹ {previous ? nameOf(previous.toolId) : "Tools"}</button>
            <h1 className="flex-1 pr-24 text-center text-[13px] font-semibold">{nameOf(top.toolId)}</h1>
          </>
        ) : (
          <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Tools</h1>
        )}
      </div>
      {top ? (
        <ToolNavigationContext.Provider value={navigation}>
          {stack.map((entry) => {
            const tool = tools.find((candidate) => candidate.id === entry.toolId)!;
            return (
              <div key={entry.key} hidden={entry !== top} className="min-h-0 flex-1 overflow-y-auto p-4">
                <tool.Component initialValue={entry.value} autoRun={entry.value !== undefined} />
              </div>
            );
          })}
        </ToolNavigationContext.Provider>
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
                  <a
                    href={`/tools/${tool.id}`}
                    onClick={(event) => {
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                      event.preventDefault();
                      push(tool.id);
                    }}
                    className="flex h-[88px] w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
                  >
                    <span className="block h-11 w-11 shrink-0"><tool.Icon /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{tool.name}</span>
                      <span className="line-clamp-2 block text-xs text-black/55">{tool.description}</span>
                    </span>
                  </a>
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
