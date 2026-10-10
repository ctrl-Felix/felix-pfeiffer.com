import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { routineName } from "../src/lib/routineName";
import { summarizeRoutines } from "../src/lib/routineUsage";

const sessionId = "session-1";
const prompt = (uuid: string, timestamp: string, content: string, origin?: string) =>
  JSON.stringify({ type: "user", uuid, sessionId, timestamp, ...(origin ? { origin: { kind: origin } } : {}), message: { role: "user", content } });
const reply = (id: string, timestamp: string, output: number, extra = {}) =>
  JSON.stringify({ type: "assistant", sessionId, timestamp, ...extra, message: { id, model: "claude-sonnet-5-5", usage: { input_tokens: 1, output_tokens: output } } });

function setup() {
  const root = mkdtempSync(join(tmpdir(), "routines-"));
  const project = join(root, "projects", "-home-user-felix-pfeiffer-com");
  mkdirSync(join(project, sessionId, "subagents"), { recursive: true });
  const files = { tokens: join(root, "tokens.json"), messages: join(root, "messages.json"), routines: join(root, "routines.json") };
  const run = () => {
    execFileSync("npx", ["tsx", "scripts/update-usage.ts"], {
      env: { ...process.env, TRANSCRIPTS_ROOT: join(root, "projects"), LEDGER_FILE: files.tokens, MESSAGE_LEDGER_FILE: files.messages, ROUTINE_LEDGER_FILE: files.routines },
      stdio: "pipe",
    });
    return {
      tokens: JSON.parse(readFileSync(files.tokens, "utf8")).messages,
      messages: JSON.parse(readFileSync(files.messages, "utf8")).userMessages,
      routines: JSON.parse(readFileSync(files.routines, "utf8")),
    };
  };
  return { project, run };
}

test("the routine marker gives a clean name", () => {
  assert.equal(routineName("Routine: Weekly SEO check\nDo things."), "Weekly SEO check");
  assert.equal(routineName("\n  routine:  Dependabot <b>merge</b>  \n"), "Dependabot bmerge/b");
  assert.equal(routineName("Please look at the routine: it fails"), null);
  assert.equal(routineName("1\n2\n3\n4\n5\nRoutine: too late"), null);
  assert.equal(routineName("Routine: <>"), null);
});

test("routine turns, their subagents and executions go to the routine ledger, once each", () => {
  const { project, run } = setup();
  writeFileSync(
    join(project, `${sessionId}.jsonl`),
    [
      prompt("r1", "2026-10-10T08:00:00.000Z", "Routine: Weekly check\nCheck the site."),
      reply("a1", "2026-10-10T08:00:05.000Z", 10),
      reply("a2", "2026-10-10T08:01:00.000Z", 20),
      prompt("h1", "2026-10-10T09:00:00.000Z", "Thanks, now fix the footer.", "human"),
      reply("a3", "2026-10-10T09:00:05.000Z", 5),
      prompt("r2", "2026-10-11T08:00:00.000Z", "Routine: Weekly check\nCheck the site.", "human"),
      reply("a4", "2026-10-11T08:00:05.000Z", 7),
    ].join("\n"),
  );
  writeFileSync(join(project, sessionId, "subagents", "agent.jsonl"), reply("s1", "2026-10-10T08:00:30.000Z", 3, { isSidechain: true }));

  const first = run();
  assert.equal(Object.keys(first.tokens).length, 1, "only the human turn counts as building");
  assert.equal(Object.keys(first.messages).length, 1, "a routine prompt is not a message by Felix");
  assert.equal(Object.keys(first.routines.executions).length, 2);
  assert.equal(Object.keys(first.routines.messages).length, 4);
  assert.ok(Object.values(first.routines.executions).every((execution) => JSON.stringify(execution).includes("Weekly check") && JSON.stringify(execution).includes("claude-sonnet-5-5")));
  assert.deepEqual(run(), first);

  const summary = summarizeRoutines(first.routines);
  assert.equal(summary.executions, 2);
  assert.equal(summary.written, 10 + 20 + 3 + 7);
  assert.equal(summary.processed, 4 + 10 + 20 + 3 + 7);
  assert.deepEqual(summary.routines.map((routine) => [routine.name, routine.executions]), [["Weekly check", 2]]);
});

test("messages recorded as building before a routine marker was read move to the routine ledger", () => {
  const { project, run } = setup();
  writeFileSync(join(project, `${sessionId}.jsonl`), reply("a1", "2026-10-10T08:00:05.000Z", 10));
  assert.equal(Object.keys(run().tokens).length, 1);
  writeFileSync(join(project, `${sessionId}.jsonl`), [prompt("r1", "2026-10-10T08:00:00.000Z", "Routine: Nightly"), reply("a1", "2026-10-10T08:00:05.000Z", 10)].join("\n"));
  const after = run();
  assert.equal(Object.keys(after.tokens).length, 0);
  assert.equal(Object.keys(after.routines.messages).length, 1);
});
