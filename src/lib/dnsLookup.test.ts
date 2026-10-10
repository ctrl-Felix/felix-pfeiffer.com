import assert from "node:assert/strict";
import { test } from "node:test";
import { lookupDns, normalizeDnsName, type DnsResolver } from "./dnsLookup";

const failing = (code: string) => async () => {
  throw Object.assign(new Error(code), { code });
};

function resolver(overrides: Partial<DnsResolver> = {}): DnsResolver {
  return {
    resolve4: (async () => [{ address: "93.184.216.34", ttl: 300 }]) as unknown as DnsResolver["resolve4"],
    resolve6: failing("ENODATA") as unknown as DnsResolver["resolve6"],
    resolveCname: failing("ENODATA") as unknown as DnsResolver["resolveCname"],
    resolveMx: (async () => [{ priority: 20, exchange: "MAIL2.Example.com" }, { priority: 10, exchange: "mail.example.com" }]) as unknown as DnsResolver["resolveMx"],
    resolveNs: (async () => ["B.iana-servers.net", "a.iana-servers.net"]) as unknown as DnsResolver["resolveNs"],
    resolveTxt: (async () => [["v=spf1 ", "-all"], ["hello"]]) as unknown as DnsResolver["resolveTxt"],
    resolveSoa: (async () => ({ nsname: "ns.icann.org", hostmaster: "noc.dns.icann.org", serial: 1, refresh: 7200, retry: 3600, expire: 1209600, minttl: 3600 })) as unknown as DnsResolver["resolveSoa"],
    resolveCaa: (async () => [{ critical: 128, issue: "letsencrypt.org" }, { critical: 0, iodef: "mailto:sec@example.com" }]) as unknown as DnsResolver["resolveCaa"],
    ...overrides,
  };
}

test("names are validated: public domains and underscore names pass, internal names and addresses fail", () => {
  assert.equal(normalizeDnsName("Example.COM."), "example.com");
  assert.equal(normalizeDnsName("_dmarc.example.com"), "_dmarc.example.com");
  assert.equal(normalizeDnsName("münchen.de"), "xn--mnchen-3ya.de");
  for (const bad of ["", "localhost", "db.internal", "printer.local", "10.0.0.1", "1.2.3.4", "a b.com", "-x.com", "x.com/path", "user@x.com", "x.123", "a".repeat(64) + ".com", "single"]) {
    assert.equal(normalizeDnsName(bad), null, bad);
  }
});

test("records are normalized, sorted and TXT chunks joined", async () => {
  const result = await lookupDns("normalized.example.com", ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CAA"], resolver());
  assert.equal(result.exists, true);
  assert.deepEqual(result.records.A, [{ address: "93.184.216.34", ttl: 300 }]);
  assert.deepEqual(result.records.AAAA, []);
  assert.deepEqual(result.records.MX, [{ priority: 10, exchange: "mail.example.com" }, { priority: 20, exchange: "mail2.example.com" }]);
  assert.deepEqual(result.records.NS, ["a.iana-servers.net", "b.iana-servers.net"]);
  assert.deepEqual(result.records.TXT, ["v=spf1 -all", "hello"]);
  assert.equal(result.records.SOA?.primaryNameserver, "ns.icann.org");
  assert.deepEqual(result.records.CAA, [
    { critical: true, tag: "issue", value: "letsencrypt.org" },
    { critical: false, tag: "iodef", value: "mailto:sec@example.com" },
  ]);
  assert.deepEqual(result.failures, {});
  assert.deepEqual(Object.keys(result.records), ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CAA"]);
});

test("only the requested types are queried", async () => {
  const result = await lookupDns("only-a.example.com", ["A"], resolver());
  assert.deepEqual(Object.keys(result.records), ["A"]);
});

test("a name that does not exist is reported as such", async () => {
  const gone = failing("ENOTFOUND");
  const result = await lookupDns("missing.example.com", ["A", "NS"], resolver({ resolve4: gone as unknown as DnsResolver["resolve4"], resolveNs: gone as unknown as DnsResolver["resolveNs"] }));
  assert.equal(result.exists, false);
  assert.deepEqual(result.failures, {});
});

test("single failures are listed and total failure throws", async () => {
  const result = await lookupDns("partial.example.com", ["A", "MX"], resolver({ resolveMx: failing("ETIMEOUT") as unknown as DnsResolver["resolveMx"] }));
  assert.equal(result.exists, true);
  assert.deepEqual(result.failures, { MX: "ETIMEOUT" });
  const timeout = failing("ETIMEOUT");
  await assert.rejects(lookupDns("down.example.com", ["A"], resolver({ resolve4: timeout as unknown as DnsResolver["resolve4"] })), /resolver unavailable/);
});
