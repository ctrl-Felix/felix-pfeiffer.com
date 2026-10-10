import assert from "node:assert/strict";
import { test } from "node:test";
import { trafficSummary } from "../components/stats/traffic";
import type { Stats } from "./stats";
import { classifySource, landingPath } from "./trafficSources";

const own = "felix-pfeiffer.com";

test("AI assistants are told apart from search engines and websites", () => {
  assert.equal(classifySource("chatgpt.com", "", own), "chatgpt");
  assert.equal(classifySource("", "chatgpt.com", own), "chatgpt");
  assert.equal(classifySource("www.google.com", "chatgpt.com", own), "chatgpt");
  assert.equal(classifySource("claude.ai", "", own), "claude");
  assert.equal(classifySource("www.perplexity.ai", "", own), "perplexity");
  assert.equal(classifySource("gemini.google.com", "", own), "gemini");
  assert.equal(classifySource("copilot.microsoft.com", "", own), "copilot");
  assert.equal(classifySource("www.google.de", "", own), "google");
  assert.equal(classifySource("google.co.uk", "", own), "google");
  assert.equal(classifySource("www.bing.com", "", own), "bing");
  assert.equal(classifySource("search.brave.com", "", own), "brave");
  assert.equal(classifySource("www.linkedin.com", "", own), "linkedin");
  assert.equal(classifySource("example.org", "", own), "other");
  assert.equal(classifySource("notgoogle.com", "", own), "other");
  assert.equal(classifySource("google.com.evil.example", "", own), "other");
});

test("no referrer, the own site and broken input count as direct or other", () => {
  assert.equal(classifySource("", "", own), "direct");
  assert.equal(classifySource(undefined, undefined, own), "direct");
  assert.equal(classifySource("felix-pfeiffer.com", "", own), "direct");
  assert.equal(classifySource("www.felix-pfeiffer.com", "", own), "direct");
  assert.equal(classifySource("localhost", "", own), "direct");
  assert.equal(classifySource("<script>", "", own), "other");
  assert.equal(classifySource("a".repeat(300) + ".com", "", own), "other");
  assert.equal(classifySource("", "direct", own), "direct");
  assert.equal(classifySource("", "newsletter", own), "direct");
  assert.equal(classifySource({}, 42, own), "direct");
});

test("only public paths are stored as landing paths", () => {
  assert.equal(landingPath("/"), "/");
  assert.equal(landingPath("/about"), "/about");
  assert.equal(landingPath("/about/"), "/about");
  assert.equal(landingPath("/tools/whois"), "/tools/whois");
  assert.equal(landingPath("/secret?token=1"), "other");
  assert.equal(landingPath("/tools/unknown"), "other");
  assert.equal(landingPath(null), "other");
});

test("the summary splits visits into web, AI and direct without counting a visit twice", () => {
  const counts = (value: number) => ({ "7d": value, "30d": value, year: value, all: value });
  const stats = {
    traffic: {
      since: "2026-10-13",
      rows: [
        { source: "chatgpt", landing: "/about", counts: counts(3) },
        { source: "google", landing: "/", counts: counts(5) },
        { source: "google", landing: "/about", counts: counts(1) },
        { source: "direct", landing: "/", counts: counts(2) },
        { source: "retired", landing: "other", counts: counts(1) },
      ],
    },
  } as Stats;
  const summary = trafficSummary(stats, "30d");
  assert.equal(summary.total, 12);
  assert.deepEqual(summary.groups.map((group) => [group.id, group.count]), [["web", 7], ["ai", 3], ["direct", 2]]);
  assert.deepEqual(summary.bySource("web").map((item) => [item.source, item.count]), [["google", 6], ["retired", 1]]);
  assert.deepEqual(summary.landings[0], { path: "/", label: "Desktop", counts: { web: 5, ai: 0, direct: 2 }, total: 7 });
  assert.equal(summary.landings.find((item) => item.path === "/about")?.counts.ai, 3);
});
