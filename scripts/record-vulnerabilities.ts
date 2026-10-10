import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readVulnerabilityFiles } from "../src/lib/vulnerabilities";
import { isNpmAuditOutput, isSarifOutput, isTrivyOutput, mergeFindings, parseNpmAudit, parseSarif, parseTrivy, type Finding } from "../src/lib/vulnerabilityScan";
import type { Scanner } from "../src/lib/vulnerabilityTypes";

const highScore = 7;

function option(name: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

function main() {
  const scans = option("scans");
  const out = option("out") ?? join(process.cwd(), "security", "vulnerabilities");
  const pullRequest = Number.parseInt(option("pr") ?? "", 10);
  if (!scans) throw new Error("Pass --scans <directory with the scanner outputs>");

  const findings: Finding[] = [];
  const scanned: Scanner[] = [];
  const read = (scanner: Scanner, parse: (input: unknown) => Finding[], valid: (input: unknown) => boolean, input: unknown) => {
    if (input === undefined || !valid(input)) return console.log(`No usable ${scanner} output, its entries are left unchanged.`);
    if (!scanned.includes(scanner)) scanned.push(scanner);
    findings.push(...parse(input));
  };

  const files = existsSync(scans) ? readdirSync(scans) : [];
  read("npm-audit", parseNpmAudit, isNpmAuditOutput, files.includes("npm-audit.json") ? readJson(join(scans, "npm-audit.json")) : undefined);
  read("trivy", parseTrivy, isTrivyOutput, files.includes("trivy-image.json") ? readJson(join(scans, "trivy-image.json")) : undefined);
  const sarifFiles = files.filter((name) => name.endsWith(".sarif"));
  if (!sarifFiles.length) console.log("No CodeQL output, its entries are left unchanged.");
  for (const name of sarifFiles) read("codeql", parseSarif, isSarifOutput, readJson(join(scans, name)));

  const existing = readVulnerabilityFiles(out);
  const broken = existing.filter((entry) => !entry.item).map((entry) => entry.file);
  if (broken.length) throw new Error(`Invalid vulnerability files: ${broken.join(", ")}`);

  const today = new Date().toISOString().slice(0, 10);
  const merged = mergeFindings(
    existing.flatMap((entry) => (entry.item ? [entry.item] : [])),
    findings,
    scanned,
    today,
    Number.isInteger(pullRequest) && pullRequest > 0 ? pullRequest : null,
  );

  mkdirSync(out, { recursive: true });
  const before = new Map(existing.map((entry) => [entry.file, JSON.stringify(entry.item)]));
  for (const item of merged.items) {
    const file = `${item.id}.json`;
    if (before.get(file) !== JSON.stringify(item)) writeFileSync(join(out, file), `${JSON.stringify(item, null, 2)}\n`);
  }

  console.log(`Scanned: ${scanned.join(", ") || "nothing"}. Real vulnerabilities in this scan: ${findings.length}.`);
  console.log(`New: ${merged.added.length}, fixed: ${merged.fixed.length}, reopened: ${merged.reopened.length}.`);
  for (const finding of findings) console.log(`- ${finding.scanner} ${finding.identifier} (CVSS ${finding.score}) ${finding.location}`);

  if (process.argv.includes("--fail-on-high") && findings.some((finding) => finding.score >= highScore)) {
    console.error("This scan reports vulnerabilities with a CVSS score of 7.0 or higher.");
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
