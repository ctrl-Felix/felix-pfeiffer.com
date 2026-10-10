import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

type Counts = [input: number, output: number, cacheWrite: number, cacheRead: number];
type Entry = [model: string, ...Counts];
type Ledger = Record<string, Entry>;

const unknownModel = "unknown";

const projectsDir = process.env.TRANSCRIPTS_ROOT ?? join(homedir(), ".claude", "projects");
const file = process.env.LEDGER_FILE ?? join(__dirname, "..", "src", "data", "tokenUsage.json");
const messageFile = process.env.MESSAGE_LEDGER_FILE ?? join(__dirname, "..", "src", "data", "messageCount.json");

type MessageLedger = Record<string, string>;

type HumanEntry = {
  type?: string;
  uuid?: string;
  timestamp?: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  origin?: { kind?: string };
  attachment?: { type?: string; origin?: { kind?: string }; source_uuid?: string; delivery_id?: string; timestamp?: string };
};

async function readLedger(): Promise<Ledger> {
  try {
    const stored: Record<string, (string | number)[]> = JSON.parse(await readFile(file, "utf8")).messages ?? {};
    return Object.fromEntries(Object.entries(stored).map(([key, entry]) => [key, (typeof entry[0] === "string" ? entry : [unknownModel, ...entry]) as Entry]));
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

function collectHumanMessage(messages: MessageLedger, entry: HumanEntry) {
  if (entry.isSidechain || entry.isMeta) return;
  if (entry.type === "user" && entry.origin?.kind === "human") addMessage(messages, entry.uuid, entry.timestamp);
  if (entry.type === "attachment" && entry.attachment?.type === "queued_command" && entry.attachment.origin?.kind === "human") {
    addMessage(messages, entry.attachment.source_uuid ?? entry.attachment.delivery_id, entry.attachment.timestamp ?? entry.timestamp);
  }
}

function mergeInto(ledger: Ledger, key: string, model: string, counts: Counts) {
  const current = ledger[key] ?? [unknownModel, 0, 0, 0, 0];
  const numbers = counts.map((value, index) => Math.max(current[index + 1] as number, value));
  ledger[key] = [model === unknownModel ? current[0] : model, ...numbers] as Entry;
}

async function collect(ledger: Ledger, messages: MessageLedger, path: string) {
  for (const line of (await readFile(path, "utf8")).split("\n")) {
    const mayHaveUsage = line.includes('"usage"');
    const mayBeHuman = line.includes('"human"');
    if (!mayHaveUsage && !mayBeHuman) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (mayBeHuman) collectHumanMessage(messages, entry);
    if (!mayHaveUsage) continue;
    const usage = entry.message?.usage;
    const id = entry.message?.id;
    if (entry.type !== "assistant" || !usage || typeof id !== "string") continue;
    const model = typeof entry.message.model === "string" && entry.message.model ? entry.message.model : unknownModel;
    if (model.startsWith("<")) continue;
    mergeInto(ledger, keyOf(id), model, [usage.input_tokens ?? 0, usage.output_tokens ?? 0, usage.cache_creation_input_tokens ?? 0, usage.cache_read_input_tokens ?? 0]);
  }
}

async function readMessageLedger(): Promise<MessageLedger> {
  try {
    return JSON.parse(await readFile(messageFile, "utf8")).userMessages ?? {};
  } catch {
    return {};
  }
}

function addMessage(messages: MessageLedger, id: unknown, timestamp: unknown) {
  if (typeof id !== "string" || !id) return;
  const day = typeof timestamp === "string" ? timestamp.slice(0, 10) : "";
  const key = keyOf(id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
  if (!messages[key] || day < messages[key]) messages[key] = day;
}

function renderMessages(messages: MessageLedger) {
  const rows = Object.keys(messages).sort().map((key) => `    "${key}": "${messages[key]}"`);
  return `{\n  "userMessages": {\n${rows.join(",\n")}\n  }\n}\n`;
}

function render(ledger: Ledger) {
  const keys = Object.keys(ledger).sort();
  const rows = keys.map((key) => `    "${key}": ${JSON.stringify(ledger[key])}`);
  return `{\n  "messages": {\n${rows.join(",\n")}\n  }\n}\n`;
}

async function main() {
  const ledger = await readLedger();
  const messages = await readMessageLedger();
  const before = Object.keys(ledger).length;
  const messagesBefore = Object.keys(messages).length;
  let files = 0;
  for (const directory of await projectDirectories()) {
    for (const path of await transcriptFiles(directory)) {
      await collect(ledger, messages, path);
      files++;
    }
  }
  await writeFile(file, render(ledger));
  await writeFile(messageFile, renderMessages(messages));
  console.log(`Read ${files} transcript file(s), ${Object.keys(ledger).length - before} new API call(s), ${Object.keys(ledger).length} in the token ledger.`);
  console.log(`${Object.keys(messages).length - messagesBefore} new user message(s), ${Object.keys(messages).length} in total.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
