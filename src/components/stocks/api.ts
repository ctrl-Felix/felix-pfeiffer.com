import type { ChartData, RangeKey, SearchHit } from "@/lib/stocks";

const ttlMs = 60_000;
const chartCache = new Map<string, { at: number; data: ChartData }>();

export async function fetchChart(symbol: string, range: RangeKey, signal?: AbortSignal): Promise<ChartData> {
  const key = `${symbol}|${range}`;
  const hit = chartCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  const response = await fetch(`/api/stocks/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`, { signal });
  if (!response.ok) throw new Error("quote unavailable");
  const data: ChartData = await response.json();
  chartCache.set(key, { at: Date.now(), data });
  return data;
}

export async function searchStocks(query: string, signal?: AbortSignal): Promise<SearchHit[]> {
  const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) throw new Error("search unavailable");
  return response.json();
}
