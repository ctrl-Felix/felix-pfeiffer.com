export const ranges = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "6M": { range: "6mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  MAX: { range: "max", interval: "1mo" },
} as const;

export type RangeKey = keyof typeof ranges;
export const rangeKeys = Object.keys(ranges) as RangeKey[];

export const symbolPattern = /^[A-Za-z0-9.^=\-]{1,15}$/;

export type ChartData = {
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
  points: [number, number][];
};

export type SearchHit = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};
