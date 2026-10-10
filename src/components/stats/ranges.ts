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

export function barsFor(period: Period, stats: Stats): Bar[] {
  if (period === "7d" || period === "30d") {
    const days = period === "7d" ? stats.daily.slice(-7) : stats.daily;
    return days.map(({ day, visitors }) => ({ key: day, label: dayLabel(day), short: String(Number(day.slice(8))), value: visitors }));
  }
  const known = new Map(stats.monthly.map(({ month, visitors }) => [month, visitors]));
  if (period === "year") {
    return monthNames.map((name, index) => {
      const key = `${stats.year}-${String(index + 1).padStart(2, "0")}`;
      return { key, label: `${name} ${stats.year}`, short: name.slice(0, 1), value: known.get(key) ?? 0 };
    });
  }
  return stats.monthly.map(({ month, visitors }) => {
    const name = monthNames[Number(month.slice(5)) - 1];
    return { key: month, label: `${name} ${month.slice(0, 4)}`, short: name.slice(0, 1), value: visitors };
  });
}
