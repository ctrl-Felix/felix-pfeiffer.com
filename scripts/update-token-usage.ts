import { readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type Usage = { input: number; output: number; cacheWrite: number; cacheRead: number };

const transcriptsDir = process.env.TRANSCRIPTS_DIR ?? join(homedir(), ".claude", "projects", "-home-user-felix-pfeiffer-com");
const file = join(__dirname, "..", "src", "data", "tokenUsage.json");

async function readStored(): Promise<Record<string, Usage>> {
  try {
    return JSON.parse(await readFile(file, "utf8")).sessions ?? {};
  } catch {
    return {};
  }
}

async function usageOf(path: string): Promise<Usage> {
  const perMessage = new Map<string, Usage>();
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
    if (entry.type !== "assistant" || !usage || !id) continue;
    const current = perMessage.get(id) ?? { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
    perMessage.set(id, {
      input: Math.max(current.input, usage.input_tokens ?? 0),
      output: Math.max(current.output, usage.output_tokens ?? 0),
      cacheWrite: Math.max(current.cacheWrite, usage.cache_creation_input_tokens ?? 0),
      cacheRead: Math.max(current.cacheRead, usage.cache_read_input_tokens ?? 0),
    });
  }
  const total: Usage = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0 };
  for (const usage of perMessage.values()) {
    total.input += usage.input;
    total.output += usage.output;
    total.cacheWrite += usage.cacheWrite;
    total.cacheRead += usage.cacheRead;
  }
  return total;
}

async function main() {
  const sessions = await readStored();
  const files = (await readdir(transcriptsDir)).filter((name) => name.endsWith(".jsonl"));
  for (const name of files) sessions[name.replace(/\.jsonl$/, "")] = await usageOf(join(transcriptsDir, name));

  const sorted = Object.fromEntries(Object.entries(sessions).sort(([a], [b]) => (a < b ? -1 : 1)));
  await writeFile(file, `${JSON.stringify({ sessions: sorted }, null, 2)}\n`);
  console.log(`Updated ${files.length} session(s), ${Object.keys(sorted).length} stored.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
