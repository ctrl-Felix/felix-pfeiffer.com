import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const message = (id: string, output: number, model = "claude-sonnet-5-5") =>
  JSON.stringify({ type: "assistant", message: { id, model, usage: { input_tokens: 1, output_tokens: output, cache_creation_input_tokens: 10, cache_read_input_tokens: 100 } } });

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
  return JSON.parse(readFileSync(ledger, "utf8")).messages as Record<string, [string, number, number, number, number]>;
}

const total = (data: ReturnType<typeof run>) => Object.values(data).reduce((sum, [, input, output, write, read]) => sum + input + output + write + read, 0);

test("token ledger counts each message once across reruns, forks and streamed duplicates", () => {
  const { root, project, ledger } = setup();
  writeFileSync(join(project, "first.jsonl"), [message("m1", 5), message("m1", 50), message("m2", 7)].join("\n"));
  const once = total(run(root, ledger));
  assert.equal(once, 2 * 111 + 50 + 7);

  assert.equal(total(run(root, ledger)), once);

  writeFileSync(join(project, "fork.jsonl"), [message("m1", 50), message("m2", 7), message("m3", 3)].join("\n"));
  writeFileSync(join(project, "first", "subagents", "agent.jsonl"), message("m4", 1));
  const afterFork = total(run(root, ledger));
  assert.equal(afterFork, once + 111 + 3 + 111 + 1);

  writeFileSync(join(project, "first.jsonl"), message("m1", 5));
  assert.equal(total(run(root, ledger)), afterFork);
});

test("token ledger records the model per message and upgrades old entries without a model", () => {
  const { root, project, ledger } = setup();
  writeFileSync(ledger, JSON.stringify({ messages: { "0000000000000000": [1, 2, 3, 4] } }));
  writeFileSync(join(project, "first.jsonl"), [message("m1", 5, "claude-sonnet-5-5"), message("m2", 7, "claude-haiku-5-5"), message("m3", 1, "<synthetic>")].join("\n"));
  const data = run(root, ledger);
  assert.deepEqual(data["0000000000000000"], ["unknown", 1, 2, 3, 4]);
  assert.deepEqual(Object.values(data).map((entry) => entry[0]).sort(), ["claude-haiku-5-5", "claude-sonnet-5-5", "unknown"]);
});
