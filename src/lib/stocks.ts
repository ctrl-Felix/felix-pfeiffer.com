export const ranges = {
  "1D": { interval: "5min", outputsize: 78 },
  "1W": { interval: "30min", outputsize: 65 },
  "1M": { interval: "1day", outputsize: 22 },
  "6M": { interval: "1day", outputsize: 126 },
  YTD: { interval: "1day", outputsize: 260 },
  "1Y": { interval: "1day", outputsize: 252 },
  "5Y": { interval: "1week", outputsize: 260 },
  MAX: { interval: "1month", outputsize: 600 },
} as const;

export type RangeKey = keyof typeof ranges;
export const rangeKeys = Object.keys(ranges) as RangeKey[];

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
