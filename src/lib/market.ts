import { readSecret } from "./secrets";
import { ranges, type ChartData, type Quote, type QuoteSummary, type RangeKey, type SearchHit } from "./stocks";

const base = process.env.MARKET_DATA_BASE ?? "https://api.twelvedata.com";
const creditsPerMinute = 8;
const creditsPerDay = 780;
const maxWaitMs = 30_000;
const maxBatch = 8;
const maxCacheEntries = 1000;

const minute = 60_000;
const quoteTtlMs = 15 * minute;
const searchTtlMs = 24 * 60 * minute;
const seriesTtlMs: Record<string, number> = { "5min": 5 * minute, "30min": 15 * minute };

const cache = new Map<string, { expires: number; value: unknown }>();
const spent: { at: number; credits: number }[] = [];
let day = { key: "", credits: 0 };

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  try {
    const value = await load();
    if (cache.size > maxCacheEntries) cache.clear();
    cache.set(key, { expires: Date.now() + ttlMs, value });
    return value;
  } catch (error) {
    if (hit) return hit.value as T;
    throw error;
  }
}

async function spend(credits: number) {
  const today = new Date().toISOString().slice(0, 10);
  if (day.key !== today) day = { key: today, credits: 0 };
  if (day.credits + credits > creditsPerDay) throw new Error("daily credit budget used up");
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const now = Date.now();
    while (spent.length && now - spent[0].at >= minute) spent.shift();
    const used = spent.reduce((sum, entry) => sum + entry.credits, 0);
    if (used + credits <= creditsPerMinute) {
      spent.push({ at: now, credits });
      day.credits += credits;
      return;
    }
    if (now + 500 > deadline) throw new Error("per-minute credit budget used up");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function getJson(path: string, credits: number) {
  const key = readSecret("TWELVE_DATA_API_KEY");
  if (!key) throw new Error("market data is not configured");
  await spend(credits);
  const response = await fetch(base + path, {
    headers: { Authorization: `apikey ${key}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.status === "error") throw new Error(`upstream error ${json?.code ?? response.status}`);
  return json;
}

const toNumber = (value: unknown) => {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
};

function toSummary(raw: Record<string, unknown> | undefined): QuoteSummary | null {
  const price = toNumber(raw?.close);
  const previous = toNumber(raw?.previous_close);
  if (!raw || typeof raw.symbol !== "string" || price === null || previous === null) return null;
  const year = (raw.fifty_two_week ?? {}) as Record<string, unknown>;
  return {
    symbol: raw.symbol.toUpperCase(),
    name: String(raw.name ?? raw.symbol),
    currency: String(raw.currency ?? ""),
    exchange: String(raw.exchange ?? ""),
    price,
    baseline: previous,
    previousClose: previous,
    dayHigh: toNumber(raw.high),
    dayLow: toNumber(raw.low),
    yearHigh: toNumber(year.high),
    yearLow: toNumber(year.low),
    volume: toNumber(raw.volume),
  };
}

const quotes = new Map<string, { expires: number; value: QuoteSummary }>();

async function fetchQuoteBatch(symbols: string[]) {
  const json = await getJson(`/quote?symbol=${encodeURIComponent(symbols.join(","))}`, symbols.length);
  const byRequested: Record<string, unknown> = symbols.length === 1 && "symbol" in json ? { [symbols[0]]: json } : json;
  for (const symbol of symbols) {
    const summary = toSummary(byRequested[symbol] as Record<string, unknown> | undefined);
    if (summary) quotes.set(symbol, { expires: Date.now() + quoteTtlMs, value: summary });
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const missing = symbols.filter((symbol) => !((quotes.get(symbol)?.expires ?? 0) > Date.now()));
  for (let index = 0; index < missing.length; index += maxBatch) {
    await fetchQuoteBatch(missing.slice(index, index + maxBatch)).catch(() => {});
  }
  if (quotes.size > maxCacheEntries) quotes.clear();
  return symbols.flatMap((symbol) => {
    const entry = quotes.get(symbol);
    return entry ? [{ ...entry.value, requested: symbol }] : [];
  });
}

function parseTime(datetime: string) {
  const iso = datetime.length === 10 ? `${datetime}T00:00:00Z` : `${datetime.replace(" ", "T")}Z`;
  return Math.floor(Date.parse(iso) / 1000);
}

export async function getChart(symbol: string, rangeKey: RangeKey): Promise<ChartData> {
  const [quote] = await getQuotes([symbol]);
  if (!quote) throw new Error("no quote");
  const { interval, outputsize } = ranges[rangeKey];
  const startDate = rangeKey === "YTD" ? `&start_date=${new Date().getUTCFullYear()}-01-01` : "";
  const points = await cached<[number, number][]>(`series:${symbol}:${rangeKey}`, seriesTtlMs[interval] ?? 60 * minute, async () => {
    const json = await getJson(
      `/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${outputsize}&timezone=UTC${startDate}`,
      1,
    );
    const values: Record<string, string>[] = json?.values ?? [];
    return values
      .flatMap((value) => {
        const close = toNumber(value.close);
        const time = parseTime(String(value.datetime));
        return close !== null && Number.isFinite(time) ? [[time, close] as [number, number]] : [];
      })
      .sort((a, b) => a[0] - b[0]);
  });
  if (!points.length) throw new Error("no series");
  const { requested, ...summary } = quote;
  void requested;
  return { ...summary, baseline: rangeKey === "1D" ? quote.baseline : points[0][1], points };
}

export function searchSymbols(query: string) {
  return cached<SearchHit[]>(`search:${query.toLowerCase()}`, searchTtlMs, async () => {
    const json = await getJson(`/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=12`, 1);
    const seen = new Set<string>();
    const data: Record<string, unknown>[] = json?.data ?? [];
    return data
      .filter((item) => typeof item.symbol === "string" && item.country === "United States" && !seen.has(item.symbol as string) && seen.add(item.symbol as string))
      .slice(0, 8)
      .map((item) => ({
        symbol: String(item.symbol),
        name: String(item.instrument_name ?? item.symbol),
        exchange: String(item.exchange ?? ""),
        type: String(item.instrument_type ?? ""),
      }));
  });
}
