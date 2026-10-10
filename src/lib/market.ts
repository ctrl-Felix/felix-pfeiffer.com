import { readSecret } from "./secrets";
import { ranges, type ChartData, type Quote, type QuoteSummary, type RangeKey, type SearchHit } from "./stocks";

const dataBase = process.env.MARKET_DATA_BASE ?? "https://data.alpaca.markets";
const tradingBase = process.env.MARKET_TRADING_BASE ?? "https://paper-api.alpaca.markets";
const callsPerMinute = 150;
const maxWaitMs = 20_000;
const snapshotBatch = 50;
const maxCacheEntries = 1000;
const delayedMs = 16 * 60_000;
const dayMs = 86_400_000;
const regularOpenMinute = 9 * 60 + 30;
const regularCloseMinute = 16 * 60;

const minute = 60_000;
const quoteTtlMs = minute;
const assetsTtlMs = 24 * 60 * minute;
const intradayTtlMs = 5 * minute;
const longTtlMs = 30 * minute;

type Bar = { t: string; o: number; h: number; l: number; c: number; v: number };
type Snapshot = { latestTrade?: { p?: number }; dailyBar?: Bar; prevDailyBar?: Bar };
type Asset = { symbol: string; name: string; exchange: string };

const cache = new Map<string, { expires: number; value: unknown }>();
const calls: number[] = [];

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

async function takeCallSlot() {
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const now = Date.now();
    while (calls.length && now - calls[0] >= minute) calls.shift();
    if (calls.length < callsPerMinute) {
      calls.push(now);
      return;
    }
    if (now + 500 > deadline) throw new Error("rate budget used up");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function getJson(base: string, path: string) {
  const keyId = readSecret("ALPACA_KEY_ID");
  const secretKey = readSecret("ALPACA_SECRET_KEY");
  if (!keyId || !secretKey) throw new Error("market data is not configured");
  await takeCallSlot();
  const response = await fetch(base + path, {
    headers: { "APCA-API-KEY-ID": keyId, "APCA-API-SECRET-KEY": secretKey, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`upstream error ${response.status}`);
  return response.json();
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const cleanName = (name: string) =>
  name.replace(/ (Common Stock|Class [A-Z] Common Stock|Ordinary Shares|American Depositary Shares).*$/, "");

function loadAssets() {
  return cached<Asset[]>("assets", assetsTtlMs, async () => {
    const json: Record<string, unknown>[] = await getJson(tradingBase, "/v2/assets?status=active&asset_class=us_equity");
    return json
      .filter((asset) => asset.tradable === true && typeof asset.symbol === "string")
      .map((asset) => ({
        symbol: String(asset.symbol),
        name: cleanName(String(asset.name ?? asset.symbol)),
        exchange: String(asset.exchange ?? ""),
      }));
  });
}

const quotes = new Map<string, { expires: number; value: QuoteSummary }>();

async function fetchSnapshots(symbols: string[]) {
  const json = await getJson(dataBase, `/v2/stocks/snapshots?symbols=${encodeURIComponent(symbols.join(","))}&feed=iex`);
  const snapshots: Record<string, Snapshot | undefined> = json?.snapshots ?? json;
  const assets = await loadAssets().catch(() => [] as Asset[]);
  for (const symbol of symbols) {
    const snapshot = snapshots[symbol];
    const price = snapshot?.latestTrade?.p ?? snapshot?.dailyBar?.c;
    const previous = snapshot?.prevDailyBar?.c;
    if (!isNumber(price) || !isNumber(previous)) continue;
    const asset = assets.find((candidate) => candidate.symbol === symbol);
    quotes.set(symbol, {
      expires: Date.now() + quoteTtlMs,
      value: {
        symbol,
        name: asset?.name ?? symbol,
        currency: "USD",
        exchange: asset?.exchange ?? "",
        price,
        baseline: previous,
        previousClose: previous,
        dayHigh: snapshot?.dailyBar?.h ?? null,
        dayLow: snapshot?.dailyBar?.l ?? null,
        yearHigh: null,
        yearLow: null,
        volume: snapshot?.dailyBar?.v ?? null,
      },
    });
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const missing = symbols.filter((symbol) => !((quotes.get(symbol)?.expires ?? 0) > Date.now()));
  for (let index = 0; index < missing.length; index += snapshotBatch) {
    await fetchSnapshots(missing.slice(index, index + snapshotBatch)).catch(() => {});
  }
  if (quotes.size > maxCacheEntries) quotes.clear();
  return symbols.flatMap((symbol) => {
    const entry = quotes.get(symbol);
    return entry ? [{ ...entry.value, requested: symbol }] : [];
  });
}

const easternDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

function easternMinute(iso: string) {
  const [hours, minutes] = new Date(iso)
    .toLocaleTimeString("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":")
    .map(Number);
  return hours * 60 + minutes;
}

function getBars(symbol: string, rangeKey: RangeKey) {
  const config = ranges[rangeKey];
  const intraday = config.sessions !== undefined;
  return cached<Bar[]>(`bars:${symbol}:${rangeKey}`, intraday ? intradayTtlMs : longTtlMs, async () => {
    const now = Date.now();
    const start = config.ytd ? `${new Date().getUTCFullYear()}-01-01T00:00:00Z` : new Date(now - (config.days ?? 30) * dayMs).toISOString();
    const end = new Date(now - delayedMs).toISOString();
    const json = await getJson(
      dataBase,
      `/v2/stocks/bars?symbols=${encodeURIComponent(symbol)}&timeframe=${config.timeframe}&start=${start}&end=${end}&limit=10000&adjustment=split&feed=iex&sort=asc`,
    );
    const raw = json?.bars;
    let bars: Bar[] = (Array.isArray(raw) ? raw : (raw?.[symbol] ?? [])).filter((bar: Bar) => isNumber(bar.c) && !Number.isNaN(Date.parse(bar.t)));
    if (intraday) {
      bars = bars.filter((bar) => easternMinute(bar.t) >= regularOpenMinute && easternMinute(bar.t) < regularCloseMinute);
      const dates = [...new Set(bars.map((bar) => easternDate(bar.t)))].slice(-(config.sessions ?? 1));
      bars = bars.filter((bar) => dates.includes(easternDate(bar.t)));
    }
    return bars;
  });
}

export async function getChart(symbol: string, rangeKey: RangeKey): Promise<ChartData> {
  const [quote] = await getQuotes([symbol]);
  if (!quote) throw new Error("no quote");
  const [bars, yearBars] = await Promise.all([getBars(symbol, rangeKey), getBars(symbol, "1Y").catch(() => [] as Bar[])]);
  if (!bars.length) throw new Error("no series");
  const { requested, ...summary } = quote;
  void requested;
  return {
    ...summary,
    yearHigh: yearBars.length ? Math.max(...yearBars.map((bar) => bar.h)) : null,
    yearLow: yearBars.length ? Math.min(...yearBars.map((bar) => bar.l)) : null,
    baseline: rangeKey === "1D" ? quote.baseline : bars[0].c,
    points: bars.map((bar) => [Math.floor(Date.parse(bar.t) / 1000), bar.c] as [number, number]),
  };
}

export async function searchSymbols(query: string): Promise<SearchHit[]> {
  const needle = query.trim().toUpperCase();
  const assets = await loadAssets();
  return assets
    .flatMap((asset) => {
      const name = asset.name.toUpperCase();
      const rank = asset.symbol === needle ? 0 : asset.symbol.startsWith(needle) ? 1 : name.startsWith(needle) ? 2 : name.includes(needle) ? 3 : -1;
      return rank < 0 ? [] : [{ asset, rank }];
    })
    .sort((a, b) => a.rank - b.rank || a.asset.symbol.length - b.asset.symbol.length)
    .slice(0, 8)
    .map(({ asset }) => ({ symbol: asset.symbol, name: asset.name, exchange: asset.exchange, type: "" }));
}
