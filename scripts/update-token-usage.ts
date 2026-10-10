import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type Counts = [input: number, output: number, cacheWrite: number, cacheRead: number];
type Ledger = Record<string, Counts>;

const projectsDir = process.env.TRANSCRIPTS_ROOT ?? join(homedir(), ".claude", "projects");
const file = process.env.LEDGER_FILE ?? join(__dirname, "..", "src", "data", "tokenUsage.json");

async function readLedger(): Promise<Ledger> {
  try {
    return JSON.parse(await readFile(file, "utf8")).messages ?? {};
  } catch {
    return {};
  }
}

async function transcriptFiles(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await transcriptFiles(path)));
    else if (entry.name.endsWith(".jsonl")) found.push(path);
  }
  return found;
}

async function projectDirectories() {
  try {
    return (await readdir(projectsDir)).filter((name) => name.includes("felix-pfeiffer")).map((name) => join(projectsDir, name));
  } catch {
    return [];
  }
}

const keyOf = (messageId: string) => createHash("sha256").update(messageId).digest("hex").slice(0, 16);

function mergeInto(ledger: Ledger, key: string, counts: Counts) {
  const current = ledger[key] ?? [0, 0, 0, 0];
  ledger[key] = current.map((value, index) => Math.max(value, counts[index])) as Counts;
}

async function collect(ledger: Ledger, path: string) {
  for (const line of (await readFile(path, "utf8")).split("\n")) {
    if (!line.includes('"usage"')) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const usage = entry.message?.usage;
    const id = entry.message?.id;
    if (entry.type !== "assistant" || !usage || typeof id !== "string") continue;
    mergeInto(ledger, keyOf(id), [usage.input_tokens ?? 0, usage.output_tokens ?? 0, usage.cache_creation_input_tokens ?? 0, usage.cache_read_input_tokens ?? 0]);
  }
}

function render(ledger: Ledger) {
  const keys = Object.keys(ledger).sort();
  const rows = keys.map((key) => `    "${key}": ${JSON.stringify(ledger[key])}`);
  return `{\n  "messages": {\n${rows.join(",\n")}\n  }\n}\n`;
}

async function main() {
  const ledger = await readLedger();
  const before = Object.keys(ledger).length;
  let files = 0;
  for (const directory of await projectDirectories()) {
    for (const path of await transcriptFiles(directory)) {
      await collect(ledger, path);
      files++;
    }
  }
  await writeFile(file, render(ledger));
  console.log(`Read ${files} transcript file(s), ${Object.keys(ledger).length - before} new message(s), ${Object.keys(ledger).length} in the ledger.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
