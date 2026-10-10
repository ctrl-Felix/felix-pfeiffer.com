import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readVulnerabilityFiles } from "./vulnerabilities";
import { sortVulnerabilities, summarize } from "./vulnerabilitySummary";
import type { Vulnerability } from "./vulnerabilityTypes";

const make = (id: string, severity: Vulnerability["severity"], score: number, status: Vulnerability["status"], scanner: Vulnerability["scanner"], detected = "2026-10-10"): Vulnerability => ({
  id,
  title: id,
  explanation: "e",
  severity,
  cvss: { score, vector: null },
  scanner,
  identifier: id,
  location: "x",
  url: null,
  detected,
  status,
  fixed: status === "fixed" ? "2026-10-11" : null,
  pullRequest: null,
});

test("every committed vulnerability file is valid and named after its id", () => {
  for (const { file, item } of readVulnerabilityFiles()) {
    assert.ok(item, `${file} is not a valid vulnerability record`);
    assert.equal(file, `${item.id}.json`);
  }
});

test("invalid files are reported, not silently accepted", () => {
  const directory = mkdtempSync(join(tmpdir(), "vulns-"));
  writeFileSync(join(directory, "broken.json"), "{");
  writeFileSync(join(directory, "notes.txt"), "ignored");
  assert.deepEqual(readVulnerabilityFiles(directory), [{ file: "broken.json", item: null }]);
  assert.deepEqual(readVulnerabilityFiles(join(directory, "missing")), []);
});

test("summary counts by severity, status and scanner", () => {
  const items = [
    make("aaaaaaaaaaaa", "critical", 9.8, "open", "trivy"),
    make("bbbbbbbbbbbb", "high", 7.5, "fixed", "codeql"),
    make("cccccccccccc", "medium", 5, "open", "npm-audit"),
    make("dddddddddddd", "medium", 4.5, "fixed", "npm-audit"),
  ];
  const summary = summarize(items);
  assert.deepEqual([summary.total, summary.open, summary.fixed, summary.highestOpen], [4, 2, 2, "critical"]);
  assert.deepEqual(summary.bySeverity.medium, { open: 1, fixed: 1 });
  assert.deepEqual(summary.byScanner, { codeql: 1, "npm-audit": 2, trivy: 1 });
  assert.equal(summarize([]).highestOpen, null);
});

test("open entries come first, then by severity, score and date", () => {
  const sorted = sortVulnerabilities([
    make("aaaaaaaaaaaa", "critical", 9.8, "fixed", "trivy"),
    make("bbbbbbbbbbbb", "medium", 5, "open", "trivy"),
    make("cccccccccccc", "high", 7.1, "open", "trivy"),
    make("dddddddddddd", "high", 7.9, "open", "trivy"),
  ]);
  assert.deepEqual(sorted.map((item) => item.id[0]), ["d", "c", "b", "a"]);
});
