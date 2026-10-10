export const rangeKeys = ["1D", "1W", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;
export type RangeKey = (typeof rangeKeys)[number];

export type RangeConfig = { timeframe: string; days?: number; ytd?: boolean; sessions?: number };

export const ranges: Record<RangeKey, RangeConfig> = {
  "1D": { timeframe: "5Min", days: 6, sessions: 1 },
  "1W": { timeframe: "30Min", days: 9, sessions: 5 },
  "1M": { timeframe: "1Day", days: 31 },
  "6M": { timeframe: "1Day", days: 183 },
  YTD: { timeframe: "1Day", ytd: true },
  "1Y": { timeframe: "1Day", days: 366 },
  "5Y": { timeframe: "1Week", days: 1827 },
  MAX: { timeframe: "1Month", days: 3650 },
};

export const symbolPattern = /^[A-Za-z0-9.\-]{1,15}$/;

export type QuoteSummary = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  price: number;
  baseline: number;
  previousClose: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  volume: number | null;
};

export type ChartData = QuoteSummary & { points: [number, number][] };

export type Quote = QuoteSummary & { requested: string };

export type SearchHit = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};
