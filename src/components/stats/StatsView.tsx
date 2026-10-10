"use client";

import Link from "next/link";
import { useState } from "react";
import { trackTargets } from "@/lib/tracking";
import type { Period, Stats } from "@/lib/stats";
import { barsFor, periods } from "./ranges";
import TargetIcon from "./TargetIcon";
import VisitorChart from "./VisitorChart";

const material = "rounded-3xl bg-[#1c1c1e]/70 p-5 backdrop-blur-xl shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)]";

const targetLabel = (target: string | null) => (target && target in trackTargets ? trackTargets[target as keyof typeof trackTargets] : "—");

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) + " UTC";
}

function Transparency() {
  return (
    <section className={material}>
      <h2 className="text-lg font-semibold">Everything tracked is on this page</h2>
      <p className="mt-1 text-[15px] text-white/85">This page contains all tracked content. There are no more trackers than this.</p>
      <div className="mt-4 grid gap-4 text-sm text-white/65 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 font-semibold text-white">What is stored</h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>The time and type of an event: a visit or a click.</li>
            <li>For a click, what was pressed, for example Stocks.</li>
            <li>For a visit, a random anonymous ID that changes every day and cannot be traced back to you.</li>
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
        Each anonymous visitor counts once per day. Your IP address only lives in memory for a moment to create that ID and to limit abuse.
        Bots and visitors who send Do Not Track or Global Privacy Control are not counted. The contact form sends your message by email
        and does not save it on this site. The Stocks app requests quotes through this server from Alpaca and stores nothing.
      </p>
    </section>
  );
}

export default function StatsView({ stats }: { stats: Stats | null }) {
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="wallpaper fixed inset-0 overflow-y-auto text-white">
      <header className="glass fixed inset-x-3 top-3 z-10 mx-auto flex max-w-4xl items-center justify-between rounded-full px-4 py-2 text-sm">
        <Link href="/" className="font-medium">‹ Desktop</Link>
        <span className="font-semibold">Stats</span>
        <span className="w-16 text-right text-xs text-white/70">Public</span>
      </header>
      <main className="mx-auto max-w-4xl space-y-4 px-4 pb-16 pt-20">
        <div>
          <h1 className="text-3xl font-bold">Visitor statistics</h1>
          <p className="mt-1 text-white/75">Open for everyone. Anonymous and cookie free.</p>
        </div>
        {stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Time range">
              {periods.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={period === id}
                  onClick={() => setPeriod(id)}
                  className={`rounded-3xl bg-[#1c1c1e]/70 p-4 text-left backdrop-blur-xl transition-shadow ${period === id ? "shadow-[0_0_0_2px_#0a84ff]" : "shadow-[0_0_0_0.5px_rgba(255,255,255,0.12)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]"}`}
                >
                  <span className="block text-xs text-white/55">{label}</span>
                  <span className="block text-3xl font-semibold tabular-nums">{stats.totals[id].toLocaleString("en-US")}</span>
                </button>
              ))}
            </div>
            <section className={material}>
              <VisitorChart
                key={period}
                bars={barsFor(period, stats)}
                total={stats.totals[period]}
                caption={periods.find((item) => item.id === period)!.label}
              />
            </section>
            <section className={material}>
              <h2 className="mb-3 text-lg font-semibold">Most pressed</h2>
              <MostPressed stats={stats} period={period} />
            </section>
            <Transparency />
            <section className={material}>
              <h2 className="mb-3 text-lg font-semibold">Latest events</h2>
              {stats.recent.length ? (
                <table className="w-full text-sm">
                  <tbody>
                    {stats.recent.map((event, index) => (
                      <tr key={index} className="border-t border-white/10 first:border-0">
                        <td className="py-1.5 tabular-nums text-white/55">{formatEventTime(event.at)}</td>
                        <td className="py-1.5 capitalize">{event.kind}</td>
                        <td className="py-1.5 text-right text-white/75">{targetLabel(event.target)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-white/55">No events yet.</p>
              )}
            </section>
          </>
        ) : (
          <>
            <section className={material}>Statistics are currently unavailable.</section>
            <Transparency />
          </>
        )}
      </main>
    </div>
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
