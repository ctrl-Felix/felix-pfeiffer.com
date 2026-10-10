import assert from "node:assert/strict";
import { test } from "node:test";
import { mcpTools } from "./mcpTools";
import { isMcpTarget, isTrackTarget, mcpTargets, trackTargets } from "./tracking";

test("only whitelisted click targets are accepted", () => {
  for (const target of Object.keys(trackTargets)) assert.equal(isTrackTarget(target), true, target);
  for (const value of ["", "drop table events", "__proto__", "constructor", 5, null, undefined]) assert.equal(isTrackTarget(value), false);
});

test("every MCP tool is whitelisted for usage tracking and nothing else is", () => {
  assert.deepEqual(mcpTools.map((tool) => tool.name).sort(), Object.keys(mcpTargets).sort());
  assert.equal(isMcpTarget("whois_lookup"), true);
  assert.equal(isMcpTarget("drop table"), false);
  assert.equal(isMcpTarget(undefined), false);
});
