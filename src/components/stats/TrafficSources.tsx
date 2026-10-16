import type { Period, Stats } from "@/lib/stats";
import type { SourceGroup } from "@/lib/trafficSources";
import { trafficSummary } from "./traffic";

const groupColors: Record<SourceGroup, string> = { web: "#0a84ff", ai: "#bf5af2", direct: "#8e8e93" };

const percent = (count: number, total: number) => (total ? Math.round((count / total) * 100) : 0);

function SourceList({ items, color, empty }: { items: { source: string; label: string; count: number }[]; color: string; empty: string }) {
  if (!items.length) return <p className="text-sm text-white/55">{empty}</p>;
  const max = items[0].count;
  return (
    <ol className="space-y-2.5">
      {items.map((item) => (
        <li key={item.source}>
          <div className="flex justify-between text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="tabular-nums text-white/65">{item.count.toLocaleString("en-US")}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function TrafficSources({ stats, period, card }: { stats: Stats; period: Period; card: string }) {
  const summary = trafficSummary(stats, period);
  const since = stats.traffic.since ? `Recorded since ${stats.traffic.since}.` : "Nothing recorded yet.";

  return (
    <>
      <section className={card}>
        <h2 className="text-lg font-semibold">Where visitors come from</h2>
        <p className="mb-3 text-xs text-white/50">Web means search engines and other websites, AI means AI assistants. {since}</p>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
          {summary.groups.map((group) =>
            group.count ? <div key={group.id} style={{ width: `${percent(group.count, summary.total)}%`, background: groupColors[group.id] }} /> : null,
          )}
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2 text-sm">
          {summary.groups.map((group) => (
            <li key={group.id}>
              <span className="flex items-center gap-1.5 text-white/65">
                <span className="h-2 w-2 rounded-full" style={{ background: groupColors[group.id] }} />
                {group.label}
              </span>
              <span className="text-xl font-semibold tabular-nums">{group.count.toLocaleString("en-US")}</span>
              <span className="ml-1 text-xs text-white/50">{percent(group.count, summary.total)}%</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-4 @xl:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">AI by source</h2>
          <SourceList items={summary.bySource("ai")} color={groupColors.ai} empty="No visitors from AI assistants in this period yet." />
        </section>
        <section className={card}>
          <h2 className="mb-3 text-lg font-semibold">Web by source</h2>
          <SourceList items={summary.bySource("web")} color={groupColors.web} empty="No visitors from other websites in this period yet." />
        </section>
      </div>
      <section className={card}>
        <h2 className="mb-3 text-lg font-semibold">Landing paths</h2>
        {summary.landings.length ? (
          <ol className="space-y-2.5">
            {summary.landings.map((landing) => (
              <li key={landing.path}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{landing.label}</span>
                    <code className="ml-2 text-xs text-white/45">{landing.path === "other" ? "" : landing.path}</code>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-white/55">
                    {landing.counts.web} web · {landing.counts.ai} AI · {landing.counts.direct} direct
                  </span>
                </div>
                <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/10">
                  {(["web", "ai", "direct"] as const).map((group) =>
                    landing.counts[group] ? (
                      <div key={group} style={{ width: `${percent(landing.counts[group], summary.landings[0].total)}%`, background: groupColors[group] }} />
                    ) : null,
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-white/55">No visits recorded in this period yet.</p>
        )}
      </section>
    </>
  );
}
