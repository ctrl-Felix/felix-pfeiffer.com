import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
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
  const run = (args: string[] = []) => {
    execFileSync("npx", ["tsx", "scripts/update-usage.ts", ...args], {
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

test("the routine name comes from the trigger note or the marker line", () => {
  assert.equal(routineName('Handle the PRs.\n\n<system-reminder>This task fired at Sat 2026-10-10 23:51:26 UTC. Fired by routine "Dependency update check" (trigger_id: trig_1).</system-reminder>'), "Dependency update check");
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
      prompt("r2", "2026-10-11T08:00:00.000Z", 'Check the site.\n<system-reminder>Fired by routine "Weekly check" (trigger_id: trig_1).</system-reminder>', "human"),
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

test("a routine marks its own session, and later runs without the flag keep it a routine", () => {
  const { project, run } = setup();
  const other = (id: string) => JSON.stringify({ type: "assistant", sessionId: "older", timestamp: "2026-10-09T08:00:00.000Z", message: { id, model: "claude-opus-5-5", usage: { input_tokens: 1, output_tokens: 1 } } });
  writeFileSync(join(project, "older.jsonl"), other("o1"));
  utimesSync(join(project, "older.jsonl"), new Date("2026-10-09T08:00:00Z"), new Date("2026-10-09T08:00:00Z"));
  const session = join(project, `${sessionId}.jsonl`);
  writeFileSync(session, [prompt("t1", "2026-10-11T00:11:05.000Z", "Handle the Dependabot PRs.", "human"), reply("a1", "2026-10-11T00:11:10.000Z", 10)].join("\n"));
  writeFileSync(join(project, sessionId, "subagents", "agent.jsonl"), reply("s1", "2026-10-11T00:11:20.000Z", 3, { isSidechain: true }));

  const marked = run(["--routine", "Dependency update check"]);
  assert.deepEqual(Object.keys(marked.tokens).length, 1, "only the older session stays in the build ledger");
  assert.equal(Object.keys(marked.messages).length, 0, "the routine prompt is not a message by Felix");
  assert.deepEqual(Object.values(marked.routines.sessions), ["Dependency update check"]);
  assert.equal(Object.keys(marked.routines.messages).length, 2);
  assert.deepEqual(Object.values(marked.routines.executions).map((execution) => (execution as string[]).slice(1)), [["Dependency update check", "claude-sonnet-5-5"]]);

  writeFileSync(session, [readFileSync(session, "utf8"), reply("a2", "2026-10-11T00:12:00.000Z", 4)].join("\n"));
  const later = run();
  assert.equal(Object.keys(later.tokens).length, 1);
  assert.equal(Object.keys(later.routines.messages).length, 3);
  assert.equal(Object.keys(later.routines.executions).length, 1);
});
