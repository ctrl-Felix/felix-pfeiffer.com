import assert from "node:assert/strict";
import { test } from "node:test";
import { ageText, describeSpan, expiryText, expiryTone, formatDate } from "./whoisFormat";

const now = Date.parse("2026-10-10T12:00:00Z");
const day = 86_400_000;

test("spans are described in days, months and years", () => {
  assert.equal(describeSpan(0), "today");
  assert.equal(describeSpan(1), "1 day");
  assert.equal(describeSpan(45), "45 days");
  assert.equal(describeSpan(200), "6 months");
  assert.equal(describeSpan(400), "13 months");
  assert.equal(describeSpan(365 * 12 + 120), "12 years, 3 months");
  assert.equal(describeSpan(-366 * 5), "5 years");
});

test("expiry text and tone", () => {
  assert.equal(expiryText(new Date(now + 10 * day).toISOString(), now), "in 10 days");
  assert.equal(expiryText(new Date(now - 3 * day).toISOString(), now), "3 days ago");
  assert.equal(expiryText(null, now), null);
  assert.equal(expiryTone(new Date(now + 10 * day).toISOString(), now), "warning");
  assert.equal(expiryTone(new Date(now + 60 * day).toISOString(), now), "soon");
  assert.equal(expiryTone(new Date(now + 400 * day).toISOString(), now), "good");
  assert.equal(expiryTone(new Date(now - day).toISOString(), now), "expired");
  assert.equal(expiryTone("nonsense", now), "unknown");
});

test("age and date formatting", () => {
  assert.equal(ageText("1995-08-14T04:00:00Z", now), "31 years, 1 month");
  assert.equal(ageText("2030-01-01T00:00:00Z", now), null);
  assert.equal(formatDate("1995-08-14T04:00:00Z"), "Aug 14, 1995");
  assert.equal(formatDate(null), "—");
});
