import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const compose = read("docker-compose.yml");

function serviceBlock(name: string) {
  const match = compose.match(new RegExp(`^  ${name}:\\n((?:    .*\\n|\\n)+)`, "m"));
  assert.ok(match, `service ${name} exists`);
  return match[1];
}

test("every container is hardened: read only, no capabilities, no new privileges", () => {
  assert.match(compose, /x-hardened: &hardened\n\s+read_only: true\n\s+cap_drop:\n\s+- ALL\n\s+security_opt:\n\s+- no-new-privileges:true/);
  for (const name of ["db", "migrate", "web"]) assert.match(serviceBlock(name), /<<: \*hardened/, `${name} uses the hardened defaults`);
  assert.doesNotMatch(compose, /cap_add|privileged:|network_mode:\s*host|user:\s*["']?(root|0)/);
});

test("only web is reachable from outside and the database network is internal", () => {
  assert.doesNotMatch(compose, /^\s+ports:/m);
  assert.match(compose, /backend:\n\s+internal: true/);
  assert.doesNotMatch(serviceBlock("db"), /frontend/);
  assert.doesNotMatch(serviceBlock("migrate"), /frontend/);
});

test("web never receives the superuser or migrator password", () => {
  const web = serviceBlock("web");
  assert.doesNotMatch(web, /DB_SUPERUSER_PASSWORD|DB_MIGRATOR_PASSWORD/);
  assert.match(web, /DB_PASSWORD: \$\{DB_APP_PASSWORD:\?/);
});

test("all images run as a non root user", () => {
  for (const path of ["Dockerfile", "db/Dockerfile", "db/migrate.Dockerfile"]) {
    const users = [...read(path).matchAll(/^USER\s+(\S+)/gm)].map((match) => match[1]);
    assert.ok(users.length > 0, `${path} sets a user`);
    assert.doesNotMatch(users[users.length - 1], /^(root|0)(:|$)/, `${path} does not end as root`);
  }
});

test("credentials are required by compose and never have defaults in committed files", () => {
  for (const name of ["DB_SUPERUSER_PASSWORD", "DB_MIGRATOR_PASSWORD", "DB_APP_PASSWORD"]) {
    assert.match(compose, new RegExp(`\\$\\{${name}:\\?`), `${name} is required`);
    assert.doesNotMatch(compose, new RegExp(`\\$\\{${name}:-`), `${name} has no default`);
  }
  for (const line of read(".env.example").split("\n").filter((entry) => /PASSWORD|PASS|SECRET|TOKEN|KEY/.test(entry))) {
    assert.match(line, /=\s*$/, `${line.split("=")[0]} must be empty in .env.example`);
  }
});

test("the web app sends the security headers", async () => {
  const config = (await import("../next.config")).default;
  const rules = await config.headers!();
  const headers = Object.fromEntries(rules.flatMap((rule) => rule.headers.map((header) => [header.key, header.value])));
  assert.match(headers["Content-Security-Policy"], /default-src 'self'/);
  assert.match(headers["Content-Security-Policy"], /object-src 'none'/);
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Strict-Transport-Security"], /max-age=\d{7,}/);
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.ok(headers["Referrer-Policy"]);
  assert.ok(headers["Permissions-Policy"]);
});

test("workflows are least privilege and do not use dangerous triggers", () => {
  const workflow = read(".github/workflows/ci.yml");
  assert.match(workflow, /^permissions:\n\s+contents: read/m);
  assert.doesNotMatch(workflow, /pull_request_target|workflow_run/);
  assert.doesNotMatch(workflow, /run:.*\$\{\{\s*github\.(event|head_ref)/);
  assert.match(workflow, /pull_request:\n\s+branches: \["main"\]/);
});
