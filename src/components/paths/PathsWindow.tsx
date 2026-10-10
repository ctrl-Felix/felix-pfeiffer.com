"use client";

import { useState } from "react";
import { LogoIcon, PathsIcon, StatsIcon } from "@/components/Icons";
import { tools } from "@/components/tools/registry";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import { absoluteUrl, publicPaths, type PublicPath } from "@/data/publicPaths";

function PathIcon({ entry }: { entry: PublicPath }) {
  if (entry.kind === "tool") {
    const Icon = tools.find((tool) => tool.id === entry.toolId)?.Icon;
    return Icon ? <Icon /> : <LogoIcon />;
  }
  if (entry.icon === "paths") return <PathsIcon />;
  if (entry.icon === "stats") return <StatsIcon />;
  return <LogoIcon />;
}

const mapsTo = (entry: PublicPath) => {
  if (entry.kind === "tool") return `Desktop → Tools → ${entry.title}, maximized`;
  if (entry.kind === "page") return "Standalone page";
  if (entry.kind === "api") return "AI assistants (MCP, JSON-RPC over POST)";
  return "Desktop";
};

function Row({ entry }: { entry: PublicPath }) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(entry.path);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 block h-10 w-10 shrink-0"><PathIcon entry={entry} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{entry.title}</span>
          <code className="rounded-md bg-black/7 px-1.5 py-0.5 text-xs">{entry.path}</code>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${entry.indexed ? "bg-[#30b050]/15 text-[#1f7a35]" : "bg-black/8 text-black/55"}`}>
            {entry.indexed ? "Indexed by search engines" : "Not indexed"}
          </span>
        </div>
        <p className="mt-1 text-xs font-medium text-[#0a6cf0]">{mapsTo(entry)}</p>
        <p className="mt-0.5 text-xs text-black/55">{entry.description}</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 @max-lg:hidden">
        {entry.kind !== "api" && (
          <a href={entry.path} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[#0a84ff] px-2.5 py-1 text-center text-xs font-medium text-white">
            Open ↗
          </a>
        )}
        <button type="button" onClick={copy} className="rounded-md bg-black/7 px-2.5 py-1 text-xs font-medium hover:bg-black/12">
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </li>
  );
}

export default function PathsWindow() {
  const { dragProps } = useWindow();

  return (
    <div className="@container flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Public Paths</h1>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-[13px] text-black/60">
          Addresses that can be opened directly.
        </p>
        <ul className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
          {publicPaths.map((entry) => (
            <Row key={entry.path} entry={entry} />
          ))}
        </ul>
      </div>
    </div>
  );
}
