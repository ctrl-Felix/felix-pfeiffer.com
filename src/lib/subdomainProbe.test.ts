import assert from "node:assert/strict";
import { test } from "node:test";
import { probeCommonSubdomains, type ProbeResolver } from "./subdomainProbe";

const fail = (code: string) => {
  throw Object.assign(new Error(code), { code });
};

test("existing common names are found, missing ones are not", async () => {
  const asked: string[] = [];
  const resolver: ProbeResolver = {
    resolve4: async (name) => {
      asked.push(name);
      if (name === "www.example.com") return ["192.0.2.1"];
      if (name === "mail.example.com") return fail("ENODATA");
      return fail("ENOTFOUND");
    },
  };
  const result = await probeCommonSubdomains("example.com", resolver, ["www", "mail", "nope"]);
  assert.deepEqual(result.found.sort(), ["mail.example.com", "www.example.com"]);
  assert.equal(result.checked, 3);
  assert.equal(result.wildcardDns, false);
  assert.equal(asked.length, 4);
});

test("wildcard DNS is detected and names with the wildcard addresses are skipped", async () => {
  const resolver: ProbeResolver = { resolve4: async (name) => (name === "www.example.com" ? ["192.0.2.9"] : ["192.0.2.1", "192.0.2.2"]) };
  const result = await probeCommonSubdomains("example.com", resolver, ["www", "mail", "api"]);
  assert.deepEqual(result.found, ["www.example.com"]);
  assert.equal(result.wildcardDns, true);
});

test("unreachable resolvers are an error", async () => {
  await assert.rejects(probeCommonSubdomains("example.com", { resolve4: async () => fail("ETIMEOUT") }, ["www"]), /resolver unavailable/);
});
