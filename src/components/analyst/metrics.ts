import type { AirlineRow } from "@/lib/aviationDashboard";

export type MetricId =
  | "revenue"
  | "operatingMargin"
  | "netMargin"
  | "marketCap"
  | "priceToEarnings"
  | "yearChange"
  | "passengers"
  | "loadFactor"
  | "revenuePerPassenger";

export type Metric = {
  id: MetricId;
  label: string;
  short: string;
  value: (row: AirlineRow) => number | null;
  format: (value: number) => string;
  lowerIsBetter?: boolean;
  live?: boolean;
};

export function formatEurMillions(value: number) {
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(1)}bn`;
  return `€${Math.round(value)}m`;
}

export function formatMillions(value: number, currency: string) {
  const symbol = { EUR: "€", GBP: "£", NOK: "NOK " }[currency] ?? `${currency} `;
  if (Math.abs(value) >= 1000) return `${symbol}${(value / 1000).toFixed(2)}bn`;
  return `${symbol}${value.toFixed(1)}m`;
}

export const formatPercent = (value: number) => `${value.toFixed(1)}%`;
export const formatSigned = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

export function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export const metrics: Metric[] = [
  { id: "revenue", label: "Revenue", short: "Revenue", value: (row) => row.revenueEur, format: formatEurMillions },
  { id: "operatingMargin", label: "Operating margin", short: "Op. margin", value: (row) => row.operatingMargin, format: formatPercent },
  { id: "netMargin", label: "Net margin", short: "Net margin", value: (row) => row.netMargin, format: formatPercent },
  { id: "marketCap", label: "Market cap", short: "Mkt cap", value: (row) => row.marketCapEur, format: formatEurMillions, live: true },
  { id: "priceToEarnings", label: "Price to earnings", short: "P/E", value: (row) => row.priceToEarnings, format: (value) => `${value.toFixed(1)}x`, lowerIsBetter: true, live: true },
  { id: "yearChange", label: "Share price, 1 year", short: "1Y", value: (row) => row.yearChange, format: formatSigned, live: true },
  { id: "passengers", label: "Passengers", short: "Passengers", value: (row) => row.passengers, format: (value) => `${value.toFixed(1)}m` },
  { id: "loadFactor", label: "Load factor", short: "Load factor", value: (row) => row.loadFactor, format: formatPercent },
  { id: "revenuePerPassenger", label: "Revenue per passenger", short: "Rev./pax", value: (row) => row.revenuePerPassengerEur, format: (value) => `€${Math.round(value)}` },
];

export function ranked(rows: AirlineRow[], metric: Metric) {
  const known = rows.filter((row) => metric.value(row) !== null);
  const missing = rows.filter((row) => metric.value(row) === null);
  known.sort((a, b) => {
    const difference = (metric.value(b) as number) - (metric.value(a) as number);
    return metric.lowerIsBetter ? -difference : difference;
  });
  return [...known, ...missing];
}
