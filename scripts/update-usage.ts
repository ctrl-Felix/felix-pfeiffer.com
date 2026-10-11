import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { cleanName, routineName } from "../src/lib/routineName";

type Counts = [input: number, output: number, cacheWrite: number, cacheRead: number];
type Entry = [model: string, ...Counts];
type Ledger = Record<string, Entry>;

type RoutineEntry = [model: string, routine: string, ...Counts];
type Execution = [day: string, routine: string, model: string];
type RoutineLedger = { sessions: Record<string, string>; executions: Record<string, Execution>; messages: Record<string, RoutineEntry> };

type MessageEntry = [day: string, model: string];
type MessageLedger = Record<string, MessageEntry>;

type Turn = [timestamp: string, routine: string | null];
type Timeline = Map<string, Turn[]>;

type State = { ledger: Ledger; messages: MessageLedger; routines: RoutineLedger };

const unknownModel = "unknown";

const projectsDir = process.env.TRANSCRIPTS_ROOT ?? join(homedir(), ".claude", "projects");
const file = process.env.LEDGER_FILE ?? join(__dirname, "..", "src", "data", "tokenUsage.json");
const messageFile = process.env.MESSAGE_LEDGER_FILE ?? join(__dirname, "..", "src", "data", "messageCount.json");
const routineFile = process.env.ROUTINE_LEDGER_FILE ?? join(__dirname, "..", "src", "data", "routineUsage.json");

type TranscriptEntry = {
  type?: string;
  uuid?: string;
  sessionId?: string;
  timestamp?: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  origin?: { kind?: string };
  message?: { content?: unknown };
  attachment?: { type?: string; origin?: { kind?: string }; source_uuid?: string; delivery_id?: string; timestamp?: string };
};

async function readJson(path: string) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return {};
  }
}

async function readLedger(): Promise<Ledger> {
  const stored: Record<string, (string | number)[]> = (await readJson(file)).messages ?? {};
  return Object.fromEntries(Object.entries(stored).map(([key, entry]) => [key, (typeof entry[0] === "string" ? entry : [unknownModel, ...entry]) as Entry]));
}

async function readMessageLedger(): Promise<MessageLedger> {
  const stored: Record<string, string | string[]> = (await readJson(messageFile)).userMessages ?? {};
  return Object.fromEntries(Object.entries(stored).map(([key, value]) => [key, (typeof value === "string" ? [value, unknownModel] : value) as MessageEntry]));
}

async function readRoutineLedger(): Promise<RoutineLedger> {
  const stored = await readJson(routineFile);
  return { sessions: stored.sessions ?? {}, executions: stored.executions ?? {}, messages: stored.messages ?? {} };
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

const keyOf = (id: string) => createHash("sha256").update(id).digest("hex").slice(0, 16);

const dayOf = (timestamp: unknown) => {
  const day = typeof timestamp === "string" ? timestamp.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
};

function promptText(entry: TranscriptEntry) {
  if (entry.type !== "user" || entry.isSidechain || entry.isMeta) return null;
  const content = entry.message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content) || content.some((block) => block?.type === "tool_result")) return null;
  return content.map((block) => (block?.type === "text" && typeof block.text === "string" ? block.text : "")).join("\n");
}

function routineOf(entry: TranscriptEntry) {
  const text = promptText(entry);
  return text === null ? null : routineName(text);
}

function* parsedLines(text: string, wanted: (line: string) => boolean) {
  for (const line of text.split("\n")) {
    if (!wanted(line)) continue;
    try {
      yield { line, entry: JSON.parse(line) };
    } catch {
      continue;
    }
  }
}

function addTurns(timeline: Timeline, text: string) {
  for (const { entry } of parsedLines(text, (line) => line.includes('"type":"user"'))) {
    if (typeof entry.sessionId !== "string" || typeof entry.timestamp !== "string") continue;
    const routine = routineOf(entry);
    const human = entry.origin?.kind === "human" && promptText(entry) !== null;
    if (!routine && !human) continue;
    const turns = timeline.get(entry.sessionId) ?? [];
    turns.push([entry.timestamp, routine]);
    timeline.set(entry.sessionId, turns);
  }
}

function routineAt(timeline: Timeline, sessionId: unknown, timestamp: unknown) {
  if (typeof sessionId !== "string" || typeof timestamp !== "string") return null;
  let routine: string | null = null;
  for (const [start, name] of timeline.get(sessionId) ?? []) {
    if (start > timestamp) break;
    routine = name;
  }
  return routine;
}

function addMessage(messages: MessageLedger, id: unknown, timestamp: unknown) {
  const day = dayOf(timestamp);
  if (typeof id !== "string" || !id || !day) return;
  const key = keyOf(id);
  const current = messages[key];
  if (!current) messages[key] = [day, unknownModel];
  else if (day < current[0]) current[0] = day;
  return key;
}

function collectHumanMessage(messages: MessageLedger, entry: TranscriptEntry) {
  if (entry.isSidechain || entry.isMeta) return;
  if (entry.type === "user" && entry.origin?.kind === "human") return addMessage(messages, entry.uuid, entry.timestamp);
  if (entry.type === "attachment" && entry.attachment?.type === "queued_command" && entry.attachment.origin?.kind === "human") {
    return addMessage(messages, entry.attachment.source_uuid ?? entry.attachment.delivery_id, entry.attachment.timestamp ?? entry.timestamp);
  }
}

function addExecution(state: State, entry: TranscriptEntry, routine: string) {
  const day = dayOf(entry.timestamp);
  if (typeof entry.uuid !== "string" || !entry.uuid || !day) return;
  const key = keyOf(entry.uuid);
  delete state.messages[key];
  const current = state.routines.executions[key];
  if (!current) state.routines.executions[key] = [day, routine, unknownModel];
  else if (day < current[0]) current[0] = day;
  return key;
}

const maxCounts = (current: number[], counts: Counts) => counts.map((value, index) => Math.max(current[index] ?? 0, value)) as Counts;

function mergeBuild(state: State, key: string, model: string, counts: Counts) {
  if (state.routines.messages[key]) return;
  const current = state.ledger[key] ?? [unknownModel, 0, 0, 0, 0];
  state.ledger[key] = [model === unknownModel ? current[0] : model, ...maxCounts(current.slice(1) as number[], counts)];
}

function mergeRoutine(state: State, key: string, model: string, routine: string, counts: Counts) {
  const moved = state.ledger[key];
  delete state.ledger[key];
  const current = state.routines.messages[key] ?? [moved?.[0] ?? unknownModel, routine, ...((moved?.slice(1) as Counts) ?? [0, 0, 0, 0])];
  state.routines.messages[key] = [model === unknownModel ? current[0] : model, routine, ...maxCounts(current.slice(2) as number[], counts)];
}

async function collect(state: State, timeline: Timeline, path: string) {
  let awaitingMessages: string[] = [];
  let awaitingExecutions: string[] = [];
  const text = await readFile(path, "utf8");
  for (const { line, entry } of parsedLines(text, (line) => line.includes('"usage"') || line.includes('"human"') || line.includes('"type":"user"'))) {
    const routine = routineOf(entry);
    if (routine) {
      const key = addExecution(state, entry, routine);
      if (key) awaitingExecutions.push(key);
      continue;
    }
    const sessionKey = typeof entry.sessionId === "string" ? keyOf(entry.sessionId) : null;
    const sessionRoutine = sessionKey ? state.routines.sessions[sessionKey] : undefined;
    if (line.includes('"human"') && !sessionRoutine) {
      const key = collectHumanMessage(state.messages, entry);
      if (key) awaitingMessages.push(key);
    }
    const usage = entry.message?.usage;
    const id = entry.message?.id;
    if (entry.type !== "assistant" || !usage || typeof id !== "string") continue;
    const model = typeof entry.message.model === "string" && entry.message.model ? entry.message.model : unknownModel;
    if (model.startsWith("<")) continue;
    if (!entry.isSidechain && model !== unknownModel) {
      for (const key of awaitingMessages) if (state.messages[key]?.[1] === unknownModel) state.messages[key][1] = model;
      for (const key of awaitingExecutions) if (state.routines.executions[key]?.[2] === unknownModel) state.routines.executions[key][2] = model;
      awaitingMessages = [];
      awaitingExecutions = [];
    }
    const counts: Counts = [usage.input_tokens ?? 0, usage.output_tokens ?? 0, usage.cache_creation_input_tokens ?? 0, usage.cache_read_input_tokens ?? 0];
    const sessionExecution = sessionKey ? state.routines.executions[sessionKey] : undefined;
    if (sessionRoutine && sessionExecution?.[2] === unknownModel && !entry.isSidechain && model !== unknownModel) sessionExecution[2] = model;
    const turnRoutine = sessionRoutine ?? routineAt(timeline, entry.sessionId, entry.timestamp);
    if (turnRoutine) mergeRoutine(state, keyOf(id), model, turnRoutine, counts);
    else mergeBuild(state, keyOf(id), model, counts);
  }
}

function renderRows(rows: Record<string, unknown>) {
  return Object.keys(rows)
    .sort()
    .map((key) => `    "${key}": ${JSON.stringify(rows[key])}`)
    .join(",\n");
}

const renderSections = (sections: Record<string, Record<string, unknown>>) =>
  `{\n${Object.entries(sections)
    .map(([name, rows]) => `  "${name}": {\n${renderRows(rows)}\n  }`)
    .join(",\n")}\n}\n`;

function routineArgument() {
  const index = process.argv.indexOf("--routine");
  if (index === -1) return null;
  const name = cleanName(process.argv[index + 1] ?? "");
  if (!name) throw new Error('Pass the routine name: npm run usage:update -- --routine "<name>"');
  return name;
}

async function markCurrentSession(state: State, files: string[], routine: string) {
  const mainFiles = files.filter((path) => !path.includes("/subagents/"));
  const times = await Promise.all(mainFiles.map(async (path) => ({ path, modified: (await stat(path)).mtimeMs })));
  const newest = times.sort((a, b) => b.modified - a.modified)[0];
  if (!newest) throw new Error("No transcript of this session found.");
  const sessionId = (await readFile(newest.path, "utf8")).match(/"sessionId":"([^"]+)"/)?.[1];
  if (!sessionId) throw new Error("The newest transcript has no session id.");
  const key = keyOf(sessionId);
  state.routines.sessions[key] = routine;
  state.routines.executions[key] ??= [new Date().toISOString().slice(0, 10), routine, unknownModel];
}

async function main() {
  const state: State = { ledger: await readLedger(), messages: await readMessageLedger(), routines: await readRoutineLedger() };
  const before = { tokens: Object.keys(state.ledger).length, messages: Object.keys(state.messages).length, executions: Object.keys(state.routines.executions).length };
  const files: string[] = [];
  for (const directory of await projectDirectories()) files.push(...(await transcriptFiles(directory)));

  const timeline: Timeline = new Map();
  for (const path of files) addTurns(timeline, await readFile(path, "utf8"));
  for (const turns of timeline.values()) turns.sort((a, b) => a[0].localeCompare(b[0]));
  const marked = routineArgument();
  if (marked) await markCurrentSession(state, files, marked);
  for (const path of files) await collect(state, timeline, path);

  await writeFile(file, renderSections({ messages: state.ledger }));
  await writeFile(messageFile, renderSections({ userMessages: state.messages }));
  await writeFile(routineFile, renderSections({ sessions: state.routines.sessions, executions: state.routines.executions, messages: state.routines.messages }));
  console.log(`Read ${files.length} transcript file(s), ${Object.keys(state.ledger).length} API call(s) in the build ledger (was ${before.tokens}).`);
  console.log(`${Object.keys(state.messages).length - before.messages} new user message(s), ${Object.keys(state.messages).length} in total.`);
  console.log(`${Object.keys(state.routines.executions).length - before.executions} new routine execution(s), ${Object.keys(state.routines.executions).length} in total, ${Object.keys(state.routines.messages).length} routine API call(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
