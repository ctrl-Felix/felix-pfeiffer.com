import assert from "node:assert/strict";
import { test } from "node:test";
import { searchDatabase, searchWebsite } from "./certificateSearch";

const noWait = async () => {};

test("the database search passes the domain only as a parameter and reports a hit row limit", async () => {
  const calls: { sql: string; values: unknown[] }[] = [];
  const partial = await searchDatabase("example.com", async (sql, values) => {
    calls.push({ sql, values });
    return { rows: [{ id: "1:aa", name_value: "www.example.com", matched: "20000" }] };
  });
  assert.equal(partial.complete, false);
  assert.equal(partial.entries.length, 1);
  assert.deepEqual(calls[0].values, ["example.com", 20_000]);
  assert.doesNotMatch(calls[0].sql, /example/);
  assert.match(calls[0].sql, /\$1/);

  const full = await searchDatabase("example.com", async () => ({ rows: [] }));
  assert.deepEqual(full, { entries: [], complete: true });
});

test("the website is asked again once after a busy answer", async () => {
  const statuses = [503, 200];
  let calls = 0;
  const result = await searchWebsite("example.com", false, async () => new Response(statuses[calls++] === 200 ? "[]" : "busy", { status: statuses[calls - 1] }), noWait);
  assert.equal(calls, 2);
  assert.deepEqual(result, { entries: [], complete: true });

  let tries = 0;
  await assert.rejects(searchWebsite("example.com", false, async () => {
    tries += 1;
    return new Response("busy", { status: 429 });
  }, noWait), /429/);
  assert.equal(tries, 2);

  let notFound = 0;
  await assert.rejects(searchWebsite("example.com", false, async () => {
    notFound += 1;
    return new Response("", { status: 404 });
  }, noWait), /404/);
  assert.equal(notFound, 1);
});

test("unexpected website answers are rejected", async () => {
  await assert.rejects(searchWebsite("example.com", false, async () => new Response('{"not":"a list"}'), noWait), /unexpected/);
  assert.deepEqual(await searchWebsite("example.com", true, async () => new Response(""), noWait), { entries: [], complete: true });
});
