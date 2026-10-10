import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const call = (path: string, init: ConstructorParameters<typeof NextRequest>[1] = {}) => proxy(new NextRequest(`https://felix-pfeiffer.com${path}`, init));
const rewriteTarget = (response: Response) => response.headers.get("x-middleware-rewrite");

test("POST and DELETE on /mcp go to the MCP endpoint", () => {
  assert.match(rewriteTarget(call("/mcp", { method: "POST", body: "{}" })) ?? "", /\/api\/mcp$/);
  assert.match(rewriteTarget(call("/mcp", { method: "DELETE" })) ?? "", /\/api\/mcp$/);
});

test("GET on /mcp shows the page, an event stream request is answered by the endpoint", () => {
  assert.equal(rewriteTarget(call("/mcp", { headers: { accept: "text/html,application/xhtml+xml" } })), null);
  assert.equal(rewriteTarget(call("/mcp")), null);
  assert.match(rewriteTarget(call("/mcp", { headers: { accept: "text/event-stream" } })) ?? "", /\/api\/mcp$/);
});

test("tool paths keep working and unknown ones are a real 404", () => {
  assert.equal(call("/tools/whois").status, 200);
  assert.equal(call("/tools/nope").status, 404);
});
