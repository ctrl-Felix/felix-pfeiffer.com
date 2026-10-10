import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { sortVulnerabilities } from "./vulnerabilitySummary";
import { parseVulnerability, type Vulnerability } from "./vulnerabilityTypes";

export const vulnerabilityDirectory = join(process.cwd(), "security", "vulnerabilities");

export function readVulnerabilityFiles(directory = vulnerabilityDirectory): { file: string; item: Vulnerability | null }[] {
  let names: string[];
  try {
    names = readdirSync(directory).filter((name) => name.endsWith(".json")).sort();
  } catch {
    return [];
  }
  return names.map((file) => {
    try {
      return { file, item: parseVulnerability(JSON.parse(readFileSync(join(directory, file), "utf8"))) };
    } catch {
      return { file, item: null };
    }
  });
}

export function loadVulnerabilities() {
  return sortVulnerabilities(readVulnerabilityFiles().flatMap(({ item }) => (item ? [item] : [])));
}
