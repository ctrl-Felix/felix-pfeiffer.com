import assert from "node:assert/strict";
import { test } from "node:test";
import { handleRpc } from "./mcp";

const ip = "198.51.100.1";
const rpc = (method: string, params?: unknown, id: number | null = 1) => ({ jsonrpc: "2.0", ...(id === null ? {} : { id }), method, params });
type Reply = { result?: Record<string, unknown>; error?: { code: number } };

test("initialize negotiates the protocol version", async () => {
  const known = (await handleRpc(rpc("initialize", { protocolVersion: "2025-03-26" }), ip)) as Reply;
  assert.equal(known.result?.protocolVersion, "2025-03-26");
  const unknown = (await handleRpc(rpc("initialize", { protocolVersion: "1999-01-01" }), ip)) as Reply;
  assert.equal(unknown.result?.protocolVersion, "2025-06-18");
});

test("tools/list exposes whois_lookup as read only", async () => {
  const reply = (await handleRpc(rpc("tools/list"), ip)) as Reply;
  const tools = reply.result?.tools as { name: string; annotations: { readOnlyHint: boolean } }[];
  assert.deepEqual(tools.map((tool) => tool.name), ["whois_lookup"]);
  assert.equal(tools[0].annotations.readOnlyHint, true);
});

test("notifications get no response and unknown methods fail", async () => {
  assert.equal(await handleRpc(rpc("notifications/initialized", undefined, null), ip), null);
  const reply = (await handleRpc(rpc("resources/list"), ip)) as Reply;
  assert.equal(reply.error?.code, -32601);
});

test("tool errors are reported as results, protocol errors as errors", async () => {
  const invalid = (await handleRpc(rpc("tools/call", { name: "whois_lookup", arguments: { domain: "not a domain" } }), ip)) as Reply;
  assert.equal(invalid.result?.isError, true);
  const missing = (await handleRpc(rpc("tools/call", { name: "whois_lookup", arguments: {} }), ip)) as Reply;
  assert.equal(missing.result?.isError, true);
  const unknownTool = (await handleRpc(rpc("tools/call", { name: "nope" }), ip)) as Reply;
  assert.equal(unknownTool.error?.code, -32602);
});

test("batches answer requests only and reject bad sizes", async () => {
  const replies = (await handleRpc([rpc("ping", undefined, 1), rpc("notifications/initialized", undefined, null)], ip)) as Reply[];
  assert.equal(replies.length, 1);
  const empty = (await handleRpc([], ip)) as Reply;
  assert.equal(empty.error?.code, -32600);
});
