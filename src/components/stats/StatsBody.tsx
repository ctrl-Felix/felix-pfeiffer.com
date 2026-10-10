"use client";

import { useState } from "react";
import { legacyTargets, mcpTargets, trackTargets } from "@/lib/tracking";
import type { Period, Stats } from "@/lib/stats";
import { barsFor, mcpBarsFor, periods } from "./ranges";
import TargetIcon from "./TargetIcon";
import VisitorChart from "./VisitorChart";

type Tone = "page" | "window";

const tones: Record<Tone, { card: string; tile: string }> = {
  page: {
    card: "rounded-3xl bg-[#1c1c1e]/70 p-5 backdrop-blur-xl shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)]",
    tile: "rounded-3xl bg-[#1c1c1e]/70 p-4 backdrop-blur-xl",
  },
  window: {
    card: "rounded-2xl bg-white/7 p-4",
    tile: "rounded-2xl bg-white/7 p-3",
  },
};

const targetLabel = (target: string | null) => {
  if (target && target in trackTargets) return trackTargets[target as keyof typeof trackTargets];
  return (target && legacyTargets[target]) || "—";
};

function Transparency({ card }: { card: string }) {
  return (
    <section className={card}>
      <h2 className="text-lg font-semibold">Everything tracked is on this page</h2>
      <p className="mt-1 text-[15px] text-white/85">This page is built only from the stored events. There are no more trackers than this.</p>
      <div className="mt-4 grid gap-4 text-sm text-white/65 @xl:grid-cols-2">
        <div>
          <h3 className="mb-1 font-semibold text-white">What is stored</h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>The time and type of an event: a visit or a click.</li>
            <li>For a click, what was pressed, for example Mail.</li>
            <li>For a call to the MCP server, which tool was called. Nothing that was sent to it.</li>
            <li>A random anonymous ID that changes every day and cannot be traced back to you.</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-1 font-semibold text-white">What is not stored</h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>No cookies, no IP address, no browser details, no location, no referrer.</li>
            <li>Nothing you type: no search queries, no contact messages.</li>
            <li>No third-party analytics, ad networks or external scripts.</li>
          </ul>
        </div>
      </div>
      <p className="mt-4 text-xs text-white/50">
        Each visitor counts once per day, and each app once per visitor per day. Every MCP call is counted, without any visitor ID. Your IP address is only used in memory to create that ID and limit abuse. Bots and visitors who send Do Not Track or Global Privacy Control are not counted. Add ?notrack to any address to stop counting your own visits.
      </p>
    </section>
  );
}

export default function StatsBody({ stats, tone }: { stats: Stats | null; tone: Tone }) {
  const [period, setPeriod] = useState<Period>("30d");
  const { card, tile } = tones[tone];

  if (!stats) {
    return (
      <div className="@container space-y-4">
        <section className={card}>Statistics are currently unavailable.</section>
        <Transparency card={card} />
      </div>
    );
  }

  return (
    <div className="@container space-y-4">
      <div className="grid grid-cols-2 gap-3 @xl:grid-cols-4" role="group" aria-label="Time range">
        {periods.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={period === id}
            onClick={() => setPeriod(id)}
            className={`${tile} text-left transition-shadow ${period === id ? "shadow-[0_0_0_2px_#0a84ff]" : "shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"}`}
          >
            <span className="block text-xs text-white/55">{label}</span>
            <span className="block text-3xl font-semibold tabular-nums">{stats.totals[id].toLocaleString("en-US")}</span>
          </button>
        ))}
      </div>
      <section className={card}>
        <VisitorChart key={period} bars={barsFor(period, stats)} total={stats.totals[period]} caption={periods.find((item) => item.id === period)!.label} />
      </section>
      <section className={card}>
        <h2 className="mb-3 text-lg font-semibold">Most pressed</h2>
        <MostPressed stats={stats} period={period} />
      </section>
      <section className={card}>
        <h2 className="mb-3 text-lg font-semibold">MCP calls by tool</h2>
        <McpTools stats={stats} period={period} />
      </section>
      <section className={card}>
        <VisitorChart key={`mcp-${period}`} bars={mcpBarsFor(period, stats)} total={stats.mcp.totals[period]} caption={`MCP calls, ${periods.find((item) => item.id === period)!.label}`} unit="calls" />
      </section>
      <Transparency card={card} />
    </div>
  );
}

function McpTools({ stats, period }: { stats: Stats; period: Period }) {
  const counts = new Map(stats.mcp.tools.map((tool) => [tool.target, tool.counts[period]]));
  const ranked = [...new Set([...Object.keys(mcpTargets), ...counts.keys()])]
    .map((tool) => ({ tool, count: counts.get(tool) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.tool.localeCompare(b.tool));
  const max = Math.max(...ranked.map((item) => item.count), 1);

  return (
    <ol className="space-y-3">
      {ranked.map(({ tool, count }) => (
        <li key={tool}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>
              <span className="font-medium">{tool in mcpTargets ? mcpTargets[tool as keyof typeof mcpTargets] : tool}</span>
              <code className="ml-2 text-xs text-white/45">{tool}</code>
            </span>
            <span className="tabular-nums text-white/65">{count.toLocaleString("en-US")}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${count ? Math.max((count / max) * 100, 2) : 0}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function MostPressed({ stats, period }: { stats: Stats; period: Period }) {
  const ranked = stats.clicks
    .map((click) => ({ target: click.target, count: click.counts[period] }))
    .filter((click) => click.count > 0)
    .sort((a, b) => b.count - a.count);
  const max = ranked[0]?.count ?? 1;

  if (!ranked.length) return <p className="text-sm text-white/55">Nothing pressed in this period yet.</p>;
  return (
    <ol className="space-y-3">
      {ranked.map(({ target, count }) => (
        <li key={target} className="flex items-center gap-3">
          <TargetIcon target={target} />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{targetLabel(target)}</span>
              <span className="tabular-nums text-white/65">{count.toLocaleString("en-US")}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
