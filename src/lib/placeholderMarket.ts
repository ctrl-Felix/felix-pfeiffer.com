import { ranges, type ChartData, type Quote, type QuoteSummary, type RangeKey, type SearchHit } from "./stocks";

type Listing = { symbol: string; name: string; exchange: string };

const listings: Listing[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ" },
  { symbol: "PEP", name: "PepsiCo, Inc.", exchange: "NASDAQ" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.", exchange: "NYSE" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE" },
  { symbol: "NKE", name: "NIKE, Inc.", exchange: "NYSE" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE Arca" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF Trust", exchange: "NYSE Arca" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", exchange: "NYSE Arca" },
  { symbol: "EWG", name: "iShares MSCI Germany ETF", exchange: "NYSE Arca" },
  { symbol: "EWU", name: "iShares MSCI United Kingdom ETF", exchange: "NYSE Arca" },
  { symbol: "EWQ", name: "iShares MSCI France ETF", exchange: "NYSE Arca" },
  { symbol: "EWJ", name: "iShares MSCI Japan ETF", exchange: "NYSE Arca" },
];

const dayMs = 86_400_000;
const stepMs: Record<string, number> = { "5Min": 300_000, "30Min": 1_800_000, "1Day": dayMs, "1Week": 7 * dayMs, "1Month": 30 * dayMs };
const intradayPoints: Partial<Record<RangeKey, number>> = { "1D": 78, "1W": 65 };
const maxPoints = 600;

function hash(text: string) {
  return [...text].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function unit(seed: number) {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function priceAt(symbol: string, time: number) {
  const seed = hash(symbol);
  const base = 40 + (seed % 460);
  const phase = (seed % 628) / 100;
  const days = time / dayMs;
  const trend = 1 + 0.08 * Math.sin(days / 40 + phase) + 0.03 * Math.sin(days / 6 + phase * 2) + 0.008 * Math.sin(days * 8 + phase * 3);
  const jitter = (unit(seed + Math.floor(time / 300_000)) - 0.5) * 0.004;
  return Number((base * (trend + jitter)).toFixed(2));
}

const findListing = (symbol: string) => listings.find((listing) => listing.symbol === symbol);

function summarize(listing: Listing): QuoteSummary {
  const now = Date.now();
  const startOfToday = Math.floor(now / dayMs) * dayMs;
  const price = priceAt(listing.symbol, now);
  const previousClose = priceAt(listing.symbol, startOfToday - 60_000);
  const today = Array.from({ length: 24 }, (_, index) => priceAt(listing.symbol, startOfToday + ((now - startOfToday) * index) / 23));
  const year = Array.from({ length: 365 }, (_, index) => priceAt(listing.symbol, now - index * dayMs));
  return {
    symbol: listing.symbol,
    name: listing.name,
    currency: "USD",
    exchange: listing.exchange,
    price,
    baseline: previousClose,
    previousClose,
    dayHigh: Math.max(price, ...today),
    dayLow: Math.min(price, ...today),
    yearHigh: Math.max(...year),
    yearLow: Math.min(...year),
    volume: 1_000_000 + (hash(listing.symbol) % 90_000_000),
  };
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  return symbols.flatMap((symbol) => {
    const listing = findListing(symbol);
    return listing ? [{ ...summarize(listing), requested: symbol }] : [];
  });
}

function seriesFor(symbol: string, rangeKey: RangeKey): [number, number][] {
  const config = ranges[rangeKey];
  const step = stepMs[config.timeframe];
  const now = Math.floor(Date.now() / step) * step;
  const span = config.ytd ? now - Date.UTC(new Date().getUTCFullYear(), 0, 1) : (config.days ?? 30) * dayMs;
  const count = Math.min(intradayPoints[rangeKey] ?? Math.floor(span / step), maxPoints);
  return Array.from({ length: Math.max(count, 2) }, (_, index) => {
    const time = now - (Math.max(count, 2) - 1 - index) * step;
    return [Math.floor(time / 1000), priceAt(symbol, time)] as [number, number];
  });
}

export async function getChart(symbol: string, rangeKey: RangeKey): Promise<ChartData> {
  const listing = findListing(symbol);
  if (!listing) throw new Error("unknown symbol");
  const summary = summarize(listing);
  const points = seriesFor(symbol, rangeKey);
  return { ...summary, baseline: rangeKey === "1D" ? summary.baseline : points[0][1], points };
}

export async function searchSymbols(query: string): Promise<SearchHit[]> {
  const needle = query.trim().toUpperCase();
  return listings
    .flatMap((listing) => {
      const name = listing.name.toUpperCase();
      const rank = listing.symbol === needle ? 0 : listing.symbol.startsWith(needle) ? 1 : name.startsWith(needle) ? 2 : name.includes(needle) ? 3 : -1;
      return rank < 0 ? [] : [{ listing, rank }];
    })
    .sort((a, b) => a.rank - b.rank || a.listing.symbol.length - b.listing.symbol.length)
    .slice(0, 8)
    .map(({ listing }) => ({ symbol: listing.symbol, name: listing.name, exchange: listing.exchange, type: "" }));
}
