import { publicPaths } from "@/data/publicPaths";
import type { Period, Stats } from "@/lib/stats";
import { isTrafficSource, otherLanding, sourceGroups, trafficSources, type SourceGroup } from "@/lib/trafficSources";

export type GroupCounts = Record<SourceGroup, number>;

const emptyGroups = (): GroupCounts => ({ web: 0, ai: 0, direct: 0 });

const sourceInfo = (source: string) =>
  isTrafficSource(source) ? trafficSources[source] : { label: source, group: "web" as SourceGroup };

export const landingLabel = (path: string) =>
  path === otherLanding ? "Other paths" : (publicPaths.find((entry) => entry.path === path)?.title ?? path);

export function trafficSummary(stats: Stats, period: Period) {
  const groups = emptyGroups();
  const sources = new Map<string, number>();
  const landings = new Map<string, GroupCounts>();

  for (const row of stats.traffic.rows) {
    const count = row.counts[period];
    if (!count) continue;
    const { group } = sourceInfo(row.source);
    groups[group] += count;
    sources.set(row.source, (sources.get(row.source) ?? 0) + count);
    const landing = landings.get(row.landing) ?? emptyGroups();
    landing[group] += count;
    landings.set(row.landing, landing);
  }

  const total = groups.web + groups.ai + groups.direct;
  const ranked = [...sources.entries()]
    .map(([source, count]) => ({ source, count, ...sourceInfo(source) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    total,
    groups: sourceGroups.map((group) => ({ ...group, count: groups[group.id] })),
    bySource: (group: SourceGroup) => ranked.filter((item) => item.group === group),
    landings: [...landings.entries()]
      .map(([path, counts]) => ({ path, label: landingLabel(path), counts, total: counts.web + counts.ai + counts.direct }))
      .sort((a, b) => b.total - a.total || a.path.localeCompare(b.path)),
  };
}
