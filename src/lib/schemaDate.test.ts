import assert from "node:assert/strict";
import { test } from "node:test";
import { schemaDateTime } from "./schemaDate";

test("structured data dates are full ISO 8601 date times with a time zone", () => {
  const value = schemaDateTime("2026-10-11");
  assert.equal(value, "2026-10-11T00:00:00+00:00");
  assert.equal(new Date(value).toISOString(), "2026-10-11T00:00:00.000Z");
});
