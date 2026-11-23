import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchQuotes, parseChart, sample } from "./marketData";

const chart = (meta: Record<string, unknown>, close: unknown[]) => ({ chart: { result: [{ meta, indicators: { quote: [{ close }] } }] } });

test("a chart response becomes a quote with day and year reference prices", () => {
  const quote = parseChart("LHA.DE", chart({ currency: "EUR", regularMarketPrice: 8.4, fiftyTwoWeekHigh: 9, fiftyTwoWeekLow: 6, regularMarketTime: 1_700_000_000 }, [6, null, 7, 8, 8.2]));
  assert.deepEqual(quote, { symbol: "LHA.DE", currency: "EUR", price: 8.4, previousClose: 8, yearAgo: 6, yearHigh: 9, yearLow: 6, time: 1_700_000_000, history: [6, 7, 8, 8.2] });
});

test("broken chart responses are rejected", () => {
  assert.equal(parseChart("X", null), null);
  assert.equal(parseChart("X", { chart: { result: [] } }), null);
  assert.equal(parseChart("X", chart({ currency: "EUR", regularMarketPrice: "8" }, [])), null);
});

test("history is thinned out to a fixed number of points", () => {
  const values = Array.from({ length: 250 }, (_, index) => index);
  const thinned = sample(values, 52);
  assert.equal(thinned.length, 52);
  assert.equal(thinned[0], 0);
  assert.equal(thinned[51], 249);
});

test("failed symbols are left out instead of failing the whole request", async () => {
  const fetcher = (async (url: string) => {
    if (url.includes("BAD")) return new Response("", { status: 500 });
    return Response.json(chart({ currency: "GBp", regularMarketPrice: 150 }, [100, 150]));
  }) as typeof fetch;
  const quotes = await fetchQuotes(["GOOD.L", "BAD.L"], fetcher);
  assert.deepEqual(Object.keys(quotes), ["GOOD.L"]);
});
