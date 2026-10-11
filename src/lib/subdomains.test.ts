import assert from "node:assert/strict";
import { test } from "node:test";
import { findSubdomains, issuerOrganization, normalizeSubdomainQuery, summarizeCertificates, TooManyCertificatesError } from "./subdomains";

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

test("certificates are merged into unique names under the domain, sorted by hierarchy", () => {
  const result = summarizeCertificates("example.com", entries, "all", now);
  assert.deepEqual(result.subdomains.map((item) => item.name), ["example.com", "api.example.com", "dev.api.example.com", "www.example.com"]);
  assert.equal(result.certificates, 2);
  assert.equal(result.truncated, false);
  const apex = result.subdomains[0];
  assert.equal(apex.wildcard, true);
  assert.equal(apex.current, true);
  const www = result.subdomains[3];
  assert.equal(www.certificates, 2);
  assert.equal(www.firstSeen, "2020-01-01T00:00:00.000Z");
  assert.equal(www.lastExpires, "2026-10-30T00:00:00.000Z");
  assert.equal(result.subdomains[1].current, false);
  assert.deepEqual(result.issuers, [
    { name: "DigiCert, Inc.", certificates: 1 },
    { name: "Let's Encrypt", certificates: 1 },
  ]);
});

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

test("the search asks crt.sh for all subdomains and caches the answer", async () => {
  const urls: string[] = [];
  const fetcher = async (url: string) => {
    urls.push(url);
    return jsonResponse(entries);
  };
  const first = await findSubdomains("cache.example.com", fetcher);
  const second = await findSubdomains("cache.example.com", fetcher);
  assert.equal(first, second);
  assert.equal(urls.length, 1);
  const url = new URL(urls[0]);
  assert.equal(url.origin, "https://crt.sh");
  assert.equal(url.searchParams.get("q"), "%.cache.example.com");
  assert.equal(url.searchParams.get("output"), "json");
  assert.equal(url.searchParams.get("exclude"), null);
});

test("too many certificates fall back to unexpired ones only", async () => {
  const urls: string[] = [];
  const huge = "x".repeat(13 * 1024 * 1024);
  const fetcher = async (url: string) => {
    urls.push(url);
    return new URL(url).searchParams.get("exclude") === "expired" ? jsonResponse([{ ...entries[0], common_name: "a.big.example.com", name_value: "a.big.example.com" }]) : new Response(huge);
  };
  const result = await findSubdomains("big.example.com", fetcher);
  assert.equal(result.scope, "unexpired");
  assert.deepEqual(result.subdomains.map((item) => item.name), ["a.big.example.com"]);
  assert.equal(urls.length, 2);

  await assert.rejects(findSubdomains("huge.example.com", async () => new Response(huge)), TooManyCertificatesError);
});

test("failures and empty answers are handled", async () => {
  await assert.rejects(findSubdomains("down.example.com", async () => jsonResponse({}, 502)), /502/);
  await assert.rejects(findSubdomains("odd.example.com", async () => jsonResponse({ not: "a list" })), /unexpected/);
  const empty = await findSubdomains("empty.example.com", async () => new Response(""));
  assert.deepEqual(empty.subdomains, []);
  assert.equal(empty.certificates, 0);
});
