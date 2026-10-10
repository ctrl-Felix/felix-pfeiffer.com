import { ranges, type ChartData, type RangeKey, type SearchHit } from "./stocks";

const base = process.env.YAHOO_BASE ?? "https://query1.finance.yahoo.com";
const headers = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  Accept: "application/json",
};
const maxCacheEntries = 500;
const cache = new Map<string, { expires: number; value: unknown }>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  if (cache.size > maxCacheEntries) cache.clear();
  cache.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

async function getJson(path: string) {
  const response = await fetch(base + path, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  return response.json();
}

const numberOrNull = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

export function getChart(symbol: string, rangeKey: RangeKey) {
  return cached<ChartData>(`chart:${symbol}:${rangeKey}`, 60_000, async () => {
    const { range, interval } = ranges[rangeKey];
    const json = await getJson(`/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`);
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const times: number[] = result?.timestamp ?? [];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const points = times.flatMap((time, index) => (typeof closes[index] === "number" ? [[time, closes[index]] as [number, number]] : []));
    const price = numberOrNull(meta?.regularMarketPrice);
    if (!meta || !points.length || price === null) throw new Error("no data");
    return {
      symbol: String(meta.symbol ?? symbol).toUpperCase(),
      name: String(meta.longName ?? meta.shortName ?? symbol),
      currency: String(meta.currency ?? ""),
      exchange: String(meta.fullExchangeName ?? meta.exchangeName ?? ""),
      price,
      baseline: rangeKey === "1D" ? (numberOrNull(meta.chartPreviousClose) ?? points[0][1]) : points[0][1],
      previousClose: numberOrNull(meta.chartPreviousClose),
      dayHigh: numberOrNull(meta.regularMarketDayHigh),
      dayLow: numberOrNull(meta.regularMarketDayLow),
      yearHigh: numberOrNull(meta.fiftyTwoWeekHigh),
      yearLow: numberOrNull(meta.fiftyTwoWeekLow),
      volume: numberOrNull(meta.regularMarketVolume),
      points,
    };
  });
}

const searchTypes = new Set(["EQUITY", "ETF", "INDEX", "MUTUALFUND", "CRYPTOCURRENCY", "CURRENCY", "FUTURE"]);

export function searchSymbols(query: string) {
  return cached<SearchHit[]>(`search:${query.toLowerCase()}`, 300_000, async () => {
    const json = await getJson(`/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`);
    const quotes: Record<string, unknown>[] = json?.quotes ?? [];
    return quotes
      .filter((quote) => typeof quote.symbol === "string" && searchTypes.has(String(quote.quoteType)))
      .map((quote) => ({
        symbol: String(quote.symbol),
        name: String(quote.longname ?? quote.shortname ?? quote.symbol),
        exchange: String(quote.exchDisp ?? ""),
        type: String(quote.quoteType),
      }));
  });
}
