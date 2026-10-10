import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const human = (uuid: string, timestamp: string) => JSON.stringify({ type: "user", uuid, timestamp, origin: { kind: "human" }, message: { role: "user", content: "hello" } });
const queued = (sourceUuid: string, timestamp: string) =>
  JSON.stringify({ type: "attachment", uuid: `attachment-${sourceUuid}`, timestamp, attachment: { type: "queued_command", source_uuid: sourceUuid, origin: { kind: "human" }, prompt: "hi", timestamp } });

function run(root: string, ledger: string) {
  execFileSync("npx", ["tsx", "scripts/update-usage.ts"], {
    env: { ...process.env, TRANSCRIPTS_ROOT: join(root, "projects"), LEDGER_FILE: join(root, "tokens.json"), MESSAGE_LEDGER_FILE: ledger },
    stdio: "pipe",
  });
  return JSON.parse(readFileSync(ledger, "utf8")).userMessages as Record<string, string>;
}

test("only messages written by the human are logged, once each", () => {
  const root = mkdtempSync(join(tmpdir(), "messages-"));
  const project = join(root, "projects", "-home-user-felix-pfeiffer-com");
  mkdirSync(join(project, "first", "subagents"), { recursive: true });
  const ledger = join(root, "messages.json");

  const lines = [
    human("u1", "2026-10-07T10:00:00.000Z"),
    human("u1", "2026-10-07T10:00:00.000Z"),
    queued("q1", "2026-10-08T10:00:00.000Z"),
    JSON.stringify({ type: "user", uuid: "tool", timestamp: "2026-10-08T11:00:00.000Z", message: { role: "user", content: [{ type: "tool_result", content: "x" }] } }),
    JSON.stringify({ type: "user", uuid: "note", timestamp: "2026-10-08T11:00:00.000Z", origin: { kind: "task-notification" }, message: { role: "user", content: "<task-notification>" } }),
    JSON.stringify({ type: "user", uuid: "hook", timestamp: "2026-10-08T11:00:00.000Z", isMeta: true, origin: { kind: "human" }, message: { role: "user", content: "Stop hook feedback" } }),
    JSON.stringify({ type: "user", uuid: "agent", timestamp: "2026-10-08T11:00:00.000Z", isSidechain: true, origin: { kind: "human" }, message: { role: "user", content: "subagent prompt" } }),
    JSON.stringify({ type: "user", uuid: "summary", timestamp: "2026-10-08T11:00:00.000Z", message: { role: "user", content: "This session is being continued" } }),
  ];
  writeFileSync(join(project, "first.jsonl"), lines.join("\n"));
  assert.equal(Object.keys(run(root, ledger)).length, 2);
  assert.equal(Object.keys(run(root, ledger)).length, 2);

  writeFileSync(join(project, "fork.jsonl"), [human("u1", "2026-10-09T10:00:00.000Z"), human("u2", "2026-10-09T12:00:00.000Z")].join("\n"));
  const afterFork = run(root, ledger);
  assert.equal(Object.keys(afterFork).length, 3);
  assert.ok(Object.values(afterFork).includes("2026-10-07"), "the earliest date of a message is kept");

  writeFileSync(join(project, "first.jsonl"), human("u2", "2026-10-09T12:00:00.000Z"));
  assert.equal(Object.keys(run(root, ledger)).length, 3);
});
