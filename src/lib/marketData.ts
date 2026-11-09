export type Quote = {
  symbol: string;
  currency: string;
  price: number;
  previousClose: number | null;
  yearAgo: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  time: number;
  history: number[];
};

type Fetcher = typeof fetch;

const chartUrl = (symbol: string) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
const historyPoints = 52;
const cacheTtlMs = 15 * 60_000;
const cache = new Map<string, { expires: number; quote: Quote }>();

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function sample(values: number[], points: number) {
  if (values.length <= points) return values;
  const step = (values.length - 1) / (points - 1);
  return Array.from({ length: points }, (_, index) => values[Math.round(index * step)]);
}

export function parseChart(symbol: string, body: unknown): Quote | null {
  const result = (body as { chart?: { result?: unknown[] } })?.chart?.result?.[0] as
    | { meta?: Record<string, unknown>; indicators?: { quote?: { close?: unknown[] }[] } }
    | undefined;
  const meta = result?.meta;
  if (!meta || !isNumber(meta.regularMarketPrice) || typeof meta.currency !== "string") return null;
  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter(isNumber);
  const previous = closes.length >= 2 ? closes[closes.length - 2] : null;
  return {
    symbol,
    currency: meta.currency,
    price: meta.regularMarketPrice,
    previousClose: previous,
    yearAgo: closes[0] ?? null,
    yearHigh: isNumber(meta.fiftyTwoWeekHigh) ? meta.fiftyTwoWeekHigh : closes.length ? Math.max(...closes) : null,
    yearLow: isNumber(meta.fiftyTwoWeekLow) ? meta.fiftyTwoWeekLow : closes.length ? Math.min(...closes) : null,
    time: isNumber(meta.regularMarketTime) ? meta.regularMarketTime : 0,
    history: sample(closes, historyPoints),
  };
}

async function fetchQuote(fetcher: Fetcher, symbol: string) {
  const hit = cache.get(symbol);
  if (hit && hit.expires > Date.now()) return hit.quote;
  const response = await fetcher(chartUrl(symbol), {
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; felix-pfeiffer.com)" },
  });
  if (!response.ok) throw new Error(`${response.status}`);
  const quote = parseChart(symbol, await response.json());
  if (!quote) throw new Error("invalid");
  cache.set(symbol, { expires: Date.now() + cacheTtlMs, quote });
  return quote;
}

export async function fetchQuotes(symbols: string[], fetcher: Fetcher = fetch) {
  const results = await Promise.allSettled(symbols.map((symbol) => fetchQuote(fetcher, symbol)));
  const quotes: Record<string, Quote> = {};
  results.forEach((result, index) => {
    if (result.status === "fulfilled") quotes[symbols[index]] = result.value;
  });
  return quotes;
}
