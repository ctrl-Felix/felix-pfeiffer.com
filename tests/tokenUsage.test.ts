import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const message = (id: string, output: number) =>
  JSON.stringify({ type: "assistant", message: { id, usage: { input_tokens: 1, output_tokens: output, cache_creation_input_tokens: 10, cache_read_input_tokens: 100 } } });

function setup() {
  const root = mkdtempSync(join(tmpdir(), "tokens-"));
  const project = join(root, "projects", "-home-user-felix-pfeiffer-com");
  mkdirSync(join(project, "first", "subagents"), { recursive: true });
  return { root, project, ledger: join(root, "ledger.json") };
}

function run(root: string, ledger: string) {
  execFileSync("npx", ["tsx", "scripts/update-token-usage.ts"], {
    env: { ...process.env, TRANSCRIPTS_ROOT: join(root, "projects"), LEDGER_FILE: ledger },
    stdio: "pipe",
  });
  const data = JSON.parse(readFileSync(ledger, "utf8")).messages as Record<string, number[]>;
  return Object.values(data).reduce((sum, [input, output, write, read]) => sum + input + output + write + read, 0);
}

test("token ledger counts each message once across reruns, forks and streamed duplicates", () => {
  const { root, project, ledger } = setup();
  writeFileSync(join(project, "first.jsonl"), [message("m1", 5), message("m1", 50), message("m2", 7)].join("\n"));
  const once = run(root, ledger);
  assert.equal(once, 2 * 111 + 50 + 7);

  assert.equal(run(root, ledger), once);

  writeFileSync(join(project, "fork.jsonl"), [message("m1", 50), message("m2", 7), message("m3", 3)].join("\n"));
  writeFileSync(join(project, "first", "subagents", "agent.jsonl"), message("m4", 1));
  const afterFork = run(root, ledger);
  assert.equal(afterFork, once + 111 + 3 + 111 + 1);

  writeFileSync(join(project, "first.jsonl"), message("m1", 5));
  assert.equal(run(root, ledger), afterFork);
});
