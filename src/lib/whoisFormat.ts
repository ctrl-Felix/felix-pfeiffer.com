const dayMs = 86_400_000;
const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" };

export function formatDate(iso: string | null) {
  const time = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(time) ? "—" : new Date(time).toLocaleDateString("en-US", dateFormat);
}

export function daysUntil(iso: string | null, now = Date.now()) {
  const time = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(time) ? null : Math.round((time - now) / dayMs);
}

const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? "" : "s"}`;

export function describeSpan(days: number) {
  const total = Math.abs(days);
  if (total < 1) return "today";
  if (total < 60) return plural(total, "day");
  if (total < 730) return plural(Math.floor(total / 30.44), "month");
  const years = Math.floor(total / 365.25);
  const months = Math.floor((total - years * 365.25) / 30.44);
  return months ? `${plural(years, "year")}, ${plural(months, "month")}` : plural(years, "year");
}

export function expiryText(iso: string | null, now = Date.now()) {
  const days = daysUntil(iso, now);
  if (days === null) return null;
  if (days === 0) return "today";
  return days > 0 ? `in ${describeSpan(days)}` : `${describeSpan(days)} ago`;
}

export function ageText(iso: string | null, now = Date.now()) {
  const days = daysUntil(iso, now);
  if (days === null || days > 0) return null;
  return describeSpan(days);
}

export type ExpiryTone = "good" | "soon" | "warning" | "expired" | "unknown";

export function expiryTone(iso: string | null, now = Date.now()): ExpiryTone {
  const days = daysUntil(iso, now);
  if (days === null) return "unknown";
  if (days < 0) return "expired";
  if (days <= 30) return "warning";
  if (days <= 90) return "soon";
  return "good";
}
