import assert from "node:assert/strict";
import { test } from "node:test";
import type { Stats } from "@/lib/stats";
import { barsFor } from "./ranges";

const days = Array.from({ length: 30 }, (_, index) => ({ day: `2026-09-${String(index + 1).padStart(2, "0")}`, visitors: index }));
const stats: Stats = {
  year: 2026,
  totals: { "7d": 0, "30d": 0, year: 0, all: 0 },
  daily: days,
  monthly: [{ month: "2025-12", visitors: 4 }, { month: "2026-02", visitors: 9 }],
  clicks: [],
  recent: [],
};

test("barsFor builds the right number of bars per range", () => {
  assert.equal(barsFor("7d", stats).length, 7);
  assert.equal(barsFor("30d", stats).length, 30);
  assert.equal(barsFor("all", stats).length, 2);
});

test("barsFor zero fills the current year by month", () => {
  const bars = barsFor("year", stats);
  assert.equal(bars.length, 12);
  assert.equal(bars[1].value, 9);
  assert.equal(bars[0].value, 0);
});
