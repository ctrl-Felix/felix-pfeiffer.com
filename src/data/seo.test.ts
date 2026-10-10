import assert from "node:assert/strict";
import { test } from "node:test";
import robots from "../app/robots";
import { mcpPage } from "./mcp";
import { publicPaths } from "./publicPaths";
import { toolInfos } from "./tools";

test("every tool has search friendly metadata", () => {
  for (const tool of toolInfos) {
    assert.ok(tool.seo.title.length <= 60, `${tool.id} title is ${tool.seo.title.length} characters`);
    assert.ok(tool.seo.description.length >= 70 && tool.seo.description.length <= 160, `${tool.id} description is ${tool.seo.description.length} characters`);
    assert.ok(tool.seo.faq.length >= 3, `${tool.id} needs FAQ entries`);
    assert.match(tool.updated, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("every tool is a public path and the MCP page is indexed", () => {
  for (const tool of toolInfos) {
    const entry = publicPaths.find((item) => item.path === `/tools/${tool.id}`);
    assert.ok(entry?.indexed, `${tool.id} must be indexed`);
  }
  assert.equal(publicPaths.find((item) => item.path === "/mcp")?.indexed, true);
  assert.equal(new Set(publicPaths.map((item) => item.path)).size, publicPaths.length);
});

test("the MCP page is indexed and has search friendly metadata", () => {
  assert.ok(mcpPage.title.length <= 60, `title is ${mcpPage.title.length} characters`);
  assert.ok(mcpPage.description.length >= 70 && mcpPage.description.length <= 160, `description is ${mcpPage.description.length} characters`);
  assert.ok(mcpPage.faq.length >= 3);
  assert.equal(publicPaths.find((item) => item.path === mcpPage.path)?.indexed, true);
});

test("robots.txt never blocks an indexed path", () => {
  const rules = robots().rules as { allow: string[]; disallow: string[] };
  const blocks = (rule: string, path: string) => (rule.endsWith("$") ? path === rule.slice(0, -1) : path.startsWith(rule));
  for (const entry of publicPaths.filter((item) => item.indexed)) {
    for (const rule of rules.disallow) assert.equal(blocks(rule, entry.path), false, `${rule} blocks ${entry.path}`);
  }
  assert.equal(rules.disallow.some((rule) => blocks(rule, "/mcp")), false);
  assert.ok(rules.disallow.some((rule) => blocks(rule, "/api/mcp")));
});
