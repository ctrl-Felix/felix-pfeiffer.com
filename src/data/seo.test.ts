import assert from "node:assert/strict";
import { test } from "node:test";
import robots, { aiCrawlers } from "../app/robots";
import { llmsText } from "../lib/llmsText";
import { personNode } from "../lib/personSchema";
import { aboutPage } from "./about";
import { mcpPage } from "./mcp";
import { organizations } from "./organizations";
import { profile } from "./profile";
import { publicPaths } from "./publicPaths";
import { toolInfos, toolsHub } from "./tools";

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

type RobotsRule = { userAgent: string | string[]; allow: string[]; disallow: string[] };

test("robots.txt never blocks an indexed path for any crawler", () => {
  const rules = robots().rules as RobotsRule[];
  const blocks = (rule: string, path: string) => (rule.endsWith("$") ? path === rule.slice(0, -1) : path.startsWith(rule));
  for (const group of rules) {
    for (const entry of publicPaths.filter((item) => item.indexed)) {
      for (const rule of group.disallow) assert.equal(blocks(rule, entry.path), false, `${rule} blocks ${entry.path}`);
    }
    assert.equal(group.disallow.some((rule) => blocks(rule, "/mcp")), false);
    assert.ok(group.disallow.some((rule) => blocks(rule, "/api/mcp")));
  }
});

test("robots.txt names the AI search and training crawlers", () => {
  const agents = (robots().rules as RobotsRule[]).flatMap((group) => group.userAgent);
  for (const agent of ["GPTBot", "OAI-SearchBot", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "CCBot", "Bingbot"]) {
    assert.ok(agents.includes(agent), `${agent} is missing`);
  }
  assert.equal(new Set(aiCrawlers).size, aiCrawlers.length);
});

test("the about page is indexed, answers who Felix Pfeiffer is and has search friendly metadata", () => {
  assert.ok(aboutPage.title.length <= 60, `title is ${aboutPage.title.length} characters`);
  assert.ok(aboutPage.description.length >= 70 && aboutPage.description.length <= 160, `description is ${aboutPage.description.length} characters`);
  assert.match(aboutPage.updated, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(aboutPage.lead.startsWith(`${profile.name} is `));
  assert.equal(aboutPage.faq[0].question, `Who is ${profile.name}?`);
  assert.equal(publicPaths.find((item) => item.path === aboutPage.path)?.indexed, true);
});

test("every organization in the profile is described and named on the about page and in llms.txt", () => {
  const text = llmsText();
  const about = [aboutPage.lead, ...aboutPage.faq.map((item) => item.answer)].join(" ");
  for (const entry of [...profile.education, ...profile.experience, ...profile.ventures]) {
    assert.ok(organizations[entry.org], `${entry.org} needs an entry in organizations.ts`);
    assert.ok(text.includes(entry.org), `llms.txt misses ${entry.org}`);
    const shortName = entry.org.replace("University College London", "UCL");
    assert.ok(about.includes(entry.org) || about.includes(shortName), `the about page misses ${entry.org}`);
  }
});

test("there is no em dash in the profile texts", () => {
  const texts = [aboutPage.lead, ...aboutPage.faq.flatMap((item) => [item.question, item.answer]), llmsText()];
  for (const text of texts) assert.equal(text.includes("\u2014"), false, text.slice(0, 60));
});

test("the person entity has one id and links to the same profiles as the site", () => {
  const person = personNode();
  assert.equal(person["@id"], "https://felix-pfeiffer.com/#person");
  assert.deepEqual(person.sameAs, ["https://github.com/ctrl-Felix", "https://www.linkedin.com/in/felixpf"]);
  assert.ok(person.affiliation.some((org) => org.name === "University College London"));
  assert.ok(llmsText().includes("/about"));
});

test("the tools hub is indexed, has search friendly metadata and lists every tool", () => {
  assert.ok(toolsHub.title.length <= 60, `title is ${toolsHub.title.length} characters`);
  assert.ok(toolsHub.description.length >= 70 && toolsHub.description.length <= 160, `description is ${toolsHub.description.length} characters`);
  const hub = publicPaths.find((item) => item.path === toolsHub.path);
  assert.equal(hub?.indexed, true);
  for (const tool of toolInfos) assert.equal(publicPaths.find((item) => item.path === `/tools/${tool.id}`)?.parent, toolsHub.path);
});

test("every public path belongs to a group and every parent exists", () => {
  const paths = new Set(publicPaths.map((item) => item.path));
  for (const entry of publicPaths) {
    assert.ok(["site", "tools", "ai"].includes(entry.group), `${entry.path} needs a group`);
    if (entry.parent) assert.ok(paths.has(entry.parent), `${entry.path} has an unknown parent`);
  }
});
