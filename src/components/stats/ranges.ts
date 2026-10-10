import type { Period, Stats } from "@/lib/stats";

export const periods: { id: Period; label: string }[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
];

export type Bar = { key: string; label: string; short: string; value: number };

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayLabel(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

type Series = { year: number; daily: { day: string; value: number }[]; monthly: { month: string; value: number }[] };

function barsFromSeries(period: Period, series: Series): Bar[] {
  if (period === "7d" || period === "30d") {
    const days = period === "7d" ? series.daily.slice(-7) : series.daily;
    return days.map(({ day, value }) => ({ key: day, label: dayLabel(day), short: String(Number(day.slice(8))), value }));
  }
  const known = new Map(series.monthly.map(({ month, value }) => [month, value]));
  if (period === "year") {
    return monthNames.map((name, index) => {
      const key = `${series.year}-${String(index + 1).padStart(2, "0")}`;
      return { key, label: `${name} ${series.year}`, short: name.slice(0, 1), value: known.get(key) ?? 0 };
    });
  }
  return series.monthly.map(({ month, value }) => {
    const name = monthNames[Number(month.slice(5)) - 1];
    return { key: month, label: `${name} ${month.slice(0, 4)}`, short: name.slice(0, 1), value };
  });
}

export const barsFor = (period: Period, stats: Stats) =>
  barsFromSeries(period, {
    year: stats.year,
    daily: stats.daily.map(({ day, visitors }) => ({ day, value: visitors })),
    monthly: stats.monthly.map(({ month, visitors }) => ({ month, value: visitors })),
  });

export const mcpBarsFor = (period: Period, stats: Stats) =>
  barsFromSeries(period, {
    year: stats.year,
    daily: stats.mcp.daily.map(({ day, calls }) => ({ day, value: calls })),
    monthly: stats.mcp.monthly.map(({ month, calls }) => ({ month, value: calls })),
  });
