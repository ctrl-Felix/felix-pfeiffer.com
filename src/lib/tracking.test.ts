import assert from "node:assert/strict";
import { test } from "node:test";
import { isTrackTarget, trackTargets } from "./tracking";

test("only whitelisted click targets are accepted", () => {
  for (const target of Object.keys(trackTargets)) assert.equal(isTrackTarget(target), true, target);
  for (const value of ["", "drop table events", "__proto__", "constructor", 5, null, undefined]) assert.equal(isTrackTarget(value), false);
});
