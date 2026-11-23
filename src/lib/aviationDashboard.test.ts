import assert from "node:assert/strict";
import { test } from "node:test";
import { airlines } from "../data/aviation";
import { buildDashboard, buildRow, fxSymbols, majorUnits, toEur } from "./aviationDashboard";
import type { Quote } from "./marketData";

const quote = (symbol: string, currency: string, price: number, history = [price]): Quote => ({
  symbol,
  currency,
  price,
  previousClose: history.at(-2) ?? null,
  yearAgo: history[0],
  yearHigh: Math.max(...history),
  yearLow: Math.min(...history),
  time: 1,
  history,
});

const fx = { GBP: 0.85, NOK: 11.5, live: true };
const airline = (id: string) => airlines.find((item) => item.id === id)!;

test("every airline has a unique id and symbol and sane reported figures", () => {
  assert.equal(new Set(airlines.map((item) => item.id)).size, airlines.length);
  assert.equal(new Set(airlines.map((item) => item.symbol)).size, airlines.length);
  for (const item of airlines) {
    assert.ok(item.revenue > item.operatingProfit, item.id);
    assert.ok(item.passengers > 0 && item.sharesMillions > 0, item.id);
    assert.ok(item.loadFactor === null || (item.loadFactor > 50 && item.loadFactor <= 100), item.id);
    assert.match(item.source, /^https:\/\//);
  }
});

test("pence prices are converted to pounds and amounts to euros", () => {
  assert.deepEqual(majorUnits(250, "GBp"), { price: 2.5, currency: "GBP" });
  assert.deepEqual(majorUnits(8.4, "EUR"), { price: 8.4, currency: "EUR" });
  assert.equal(toEur(850, "GBP", fx), 1000);
  assert.equal(toEur(115, "NOK", fx), 10);
  assert.equal(toEur(1, "USD", fx), null);
});

test("a row combines reported figures with the live price", () => {
  const row = buildRow(airline("easyjet"), quote("EZJ.L", "GBp", 500, [400, 480, 500]), fx);
  assert.equal(row.price, 5);
  assert.equal(row.priceCurrency, "GBP");
  assert.equal(row.yearChange, 25);
  assert.equal(row.dayChange, 4.2);
  assert.equal(row.marketCapEur, Math.round((5 * 758) / 0.85));
  assert.equal(row.priceToEarnings, Math.round((5 * 758) / 499 * 10) / 10);
  assert.deepEqual(row.history, [4, 4.8, 5]);
  assert.equal(row.operatingMargin, 7);
});

test("missing prices and missing net profit leave the live KPIs empty", () => {
  const row = buildRow(airline("jet2"), undefined, fx);
  assert.equal(row.price, null);
  assert.equal(row.marketCapEur, null);
  assert.equal(row.priceToEarnings, null);
  assert.equal(row.netMargin, null);
  assert.ok(row.revenueEur);
});

test("the dashboard falls back to approximate rates without live FX", () => {
  const offline = buildDashboard({});
  assert.equal(offline.fx.live, false);
  assert.equal(offline.pricesLive, false);
  assert.equal(offline.rows.length, airlines.length);
  const live = buildDashboard({ [fxSymbols.GBP]: quote(fxSymbols.GBP, "GBP", 0.86), [fxSymbols.NOK]: quote(fxSymbols.NOK, "NOK", 11.6) });
  assert.deepEqual(live.fx, { GBP: 0.86, NOK: 11.6, live: true });
});
