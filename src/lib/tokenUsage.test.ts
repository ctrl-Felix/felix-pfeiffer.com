import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMillions, modelName } from "./tokenUsage";

test("model ids become readable names", () => {
  assert.equal(modelName("claude-sonnet-5-5"), "Sonnet 5.5");
  assert.equal(modelName("claude-opus-5-5"), "Opus 5.5");
  assert.equal(modelName("claude-haiku-5-5"), "Haiku 5.5");
  assert.equal(modelName("claude-opus-4-20250514"), "Opus 4");
  assert.equal(modelName("unknown"), "Unknown model");
  assert.equal(modelName("something-else"), "something-else");
});

test("tokens are shown in millions with one decimal", () => {
  assert.equal(formatMillions(91_140_000), "91.1 million");
});
