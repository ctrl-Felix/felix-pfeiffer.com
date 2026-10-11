import assert from "node:assert/strict";
import { test } from "node:test";
import type { DatabaseQuery } from "./certificateSearch";
import type { ProbeResolver } from "./subdomainProbe";
import { buildResult, findSubdomains, issuerOrganization, normalizeSubdomainQuery, TooManyCertificatesError } from "./subdomains";

const now = Date.parse("2026-10-11T00:00:00Z");

const entries = [
  {
    id: 1,
    issuer_name: "C=US, O=Let's Encrypt, CN=R11",
    common_name: "example.com",
    name_value: "example.com\n*.example.com\nwww.example.com",
    not_before: "2026-08-01T00:00:00",
    not_after: "2026-10-30T00:00:00",
  },
  {
    id: 2,
    issuer_name: 'C=US, O="DigiCert, Inc.", CN=DigiCert TLS RSA SHA256 2020 CA1',
    common_name: "api.example.com",
    name_value: "api.example.com\nWWW.Example.com.\nother.org\nadmin@example.com\nbad_.example.com",
    not_before: "2020-01-01T00:00:00",
    not_after: "2021-01-01T00:00:00",
  },
  {
    id: 2,
    issuer_name: 'C=US, O="DigiCert, Inc.", CN=DigiCert TLS RSA SHA256 2020 CA1',
    common_name: "dev.api.example.com",
    name_value: "dev.api.example.com",
    not_before: "2020-01-01T00:00:00",
    not_after: "2021-01-01T00:00:00",
  },
  { id: 3, issuer_name: "CN=Unrelated", common_name: "other.org", name_value: "other.org", not_before: "2026-01-01T00:00:00", not_after: "2027-01-01T00:00:00" },
];

const failingDatabase: DatabaseQuery = async () => {
  throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
};
const databaseWith = (rows: unknown[]): DatabaseQuery => async () => ({ rows });
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const nothingInDns: ProbeResolver = {
  resolve4: async () => {
    throw Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
  },
};
const brokenDns: ProbeResolver = {
  resolve4: async () => {
    throw Object.assign(new Error("ETIMEOUT"), { code: "ETIMEOUT" });
  },
};

test("queries are validated and reduced to a public name", () => {
  assert.equal(normalizeSubdomainQuery("Example.COM"), "example.com");
  assert.equal(normalizeSubdomainQuery("https://www.example.com/path?x=1"), "www.example.com");
  assert.equal(normalizeSubdomainQuery("*.example.com"), "example.com");
  assert.equal(normalizeSubdomainQuery("%.example.com"), "example.com");
  for (const bad of ["", "com", "localhost", "db.internal", "printer.local", "10.0.0.1", "a b.com", "x.123"]) {
    assert.equal(normalizeSubdomainQuery(bad), null, bad);
  }
});

test("issuer organizations are read from the distinguished name", () => {
  assert.equal(issuerOrganization("C=US, O=Let's Encrypt, CN=R11"), "Let's Encrypt");
  assert.equal(issuerOrganization('C=US, O="DigiCert, Inc.", CN=x'), "DigiCert, Inc.");
  assert.equal(issuerOrganization("CN=Only Name"), "Only Name");
  assert.equal(issuerOrganization(undefined), "Unknown");
});

test("certificates and DNS finds are merged into unique names under the domain, sorted by hierarchy", () => {
  const result = buildResult("example.com", { status: "complete", source: "database", entries }, { found: ["mail.example.com", "www.example.com"], checked: 120, wildcardDns: false }, now);
  assert.deepEqual(result.subdomains.map((item) => item.name), ["example.com", "api.example.com", "dev.api.example.com", "mail.example.com", "www.example.com"]);
  assert.equal(result.certificates, 2);
  assert.equal(result.truncated, false);
  const [apex, api, , mail, www] = result.subdomains;
  assert.equal(apex.wildcard, true);
  assert.equal(apex.current, true);
  assert.equal(apex.foundInDns, false);
  assert.equal(api.current, false);
  assert.deepEqual({ certificates: mail.certificates, foundInDns: mail.foundInDns, firstSeen: mail.firstSeen }, { certificates: 0, foundInDns: true, firstSeen: null });
  assert.equal(www.certificates, 2);
  assert.equal(www.foundInDns, true);
  assert.equal(www.firstSeen, "2020-01-01T00:00:00.000Z");
  assert.equal(www.lastExpires, "2026-10-30T00:00:00.000Z");
  assert.deepEqual(result.issuers, [
    { name: "DigiCert, Inc.", certificates: 1 },
    { name: "Let's Encrypt", certificates: 1 },
  ]);
  assert.deepEqual(result.dnsCheck, { checked: 120, found: 2, wildcardDns: false });
});

test("the certificate database is used first and the website is not asked", async () => {
  let fetched = false;
  const result = await findSubdomains("db.example.com", {
    query: databaseWith([{ id: "7:ab", issuer_name: "O=Let's Encrypt", common_name: "www.db.example.com", name_value: "www.db.example.com", not_before: "2026-01-01T00:00:00", not_after: "2099-01-01T00:00:00", matched: "1" }]),
    fetcher: async () => {
      fetched = true;
      return jsonResponse([]);
    },
    resolver: nothingInDns,
  });
  assert.equal(fetched, false);
  assert.equal(result.certificateSource, "database");
  assert.equal(result.certificateSearch, "complete");
  assert.deepEqual(result.subdomains.map((item) => item.name), ["www.db.example.com"]);
});

test("a failed database falls back to the website and the answer is cached", async () => {
  const urls: string[] = [];
  const sources = {
    query: failingDatabase,
    fetcher: async (url: string) => {
      urls.push(url);
      return jsonResponse(entries);
    },
    resolver: nothingInDns,
  };
  const first = await findSubdomains("cache.example.com", sources);
  const second = await findSubdomains("cache.example.com", sources);
  assert.equal(first, second);
  assert.equal(first.certificateSource, "website");
  assert.equal(urls.length, 1);
  const url = new URL(urls[0]);
  assert.equal(url.origin, "https://crt.sh");
  assert.equal(url.searchParams.get("q"), "%.cache.example.com");
});

test("too many certificates fall back to unexpired ones only", async () => {
  const huge = "x".repeat(13 * 1024 * 1024);
  const fetcher = async (url: string) =>
    new URL(url).searchParams.get("exclude") === "expired" ? jsonResponse([{ ...entries[0], common_name: "a.big.example.com", name_value: "a.big.example.com" }]) : new Response(huge);
  const result = await findSubdomains("big.example.com", { query: failingDatabase, fetcher, resolver: nothingInDns });
  assert.equal(result.certificateSearch, "unexpired");
  assert.deepEqual(result.subdomains.map((item) => item.name), ["a.big.example.com"]);

  await assert.rejects(findSubdomains("huge.example.com", { query: failingDatabase, fetcher: async () => new Response(huge), resolver: brokenDns }), TooManyCertificatesError);
});

test("DNS finds are returned when the certificate logs fail, and both failing is an error", async () => {
  const resolver: ProbeResolver = {
    resolve4: async (name) => {
      if (name === "www.dnsonly.example.com") return ["192.0.2.10"];
      throw Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
    },
  };
  const down = async () => jsonResponse({}, 500);
  const result = await findSubdomains("dnsonly.example.com", { query: failingDatabase, fetcher: down, resolver });
  assert.equal(result.certificateSearch, "failed");
  assert.equal(result.certificateSource, null);
  assert.deepEqual(result.subdomains.map((item) => item.name), ["www.dnsonly.example.com"]);

  await assert.rejects(findSubdomains("down.example.com", { query: failingDatabase, fetcher: down, resolver: brokenDns }), /no source answered/);
});
