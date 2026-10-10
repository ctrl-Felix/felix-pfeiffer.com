import assert from "node:assert/strict";
import { test } from "node:test";
import { tooMany } from "./rateLimit";

test("tooMany allows the limit and blocks beyond it per key", () => {
  assert.equal(tooMany("test", "a", 2, 60_000), false);
  assert.equal(tooMany("test", "a", 2, 60_000), false);
  assert.equal(tooMany("test", "a", 2, 60_000), true);
  assert.equal(tooMany("test", "b", 2, 60_000), false);
  assert.equal(tooMany("other", "a", 2, 60_000), false);
});
