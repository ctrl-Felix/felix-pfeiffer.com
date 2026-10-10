import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const directory = join(process.cwd(), "db", "migrations");
const files = readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();

test("migrations exist and have unique ordered versions", () => {
  assert.ok(files.length > 0);
  const versions = files.map((file) => file.split("_")[0]);
  assert.equal(new Set(versions).size, versions.length);
  for (const version of versions) assert.match(version, /^\d{14}$/);
});

test("every migration has an up and a down part", () => {
  for (const file of files) {
    const sql = readFileSync(join(directory, file), "utf8");
    assert.ok(sql.includes("-- migrate:up"), `${file} lacks -- migrate:up`);
    assert.ok(sql.includes("-- migrate:down"), `${file} lacks -- migrate:down`);
    assert.ok(sql.indexOf("-- migrate:up") < sql.indexOf("-- migrate:down"), `${file} has up after down`);
  }
});
