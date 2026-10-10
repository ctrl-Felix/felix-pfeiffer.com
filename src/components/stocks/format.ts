import type { RangeKey } from "@/lib/stocks";

const en = "en-US";

export const formatPrice = (value: number) =>
  value.toLocaleString(en, { minimumFractionDigits: 2, maximumFractionDigits: value < 1 ? 4 : 2 });

export const formatChange = (value: number) => `${value >= 0 ? "+" : "−"}${formatPrice(Math.abs(value))}`;

export const formatPercent = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;

export const formatVolume = (value: number) =>
  new Intl.NumberFormat(en, { notation: "compact", maximumFractionDigits: 2 }).format(value);

export function formatTime(seconds: number, range: RangeKey) {
  const date = new Date(seconds * 1000);
  const day = date.toLocaleDateString(en, { month: "short", day: "numeric", year: "numeric" });
  if (range === "1D") return date.toLocaleTimeString(en, { hour: "numeric", minute: "2-digit" });
  if (range === "1W") return `${day}, ${date.toLocaleTimeString(en, { hour: "numeric", minute: "2-digit" })}`;
  return day;
}

export const positiveColor = "#30d158";
export const negativeColor = "#ff453a";
