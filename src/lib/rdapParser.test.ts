import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRdap } from "./rdapParser";

const card = (properties: unknown[]) => ["vcard", [["version", {}, "text", "4.0"], ...properties]];

const comLike = {
  ldhName: "EXAMPLE.COM",
  handle: "2336799_DOMAIN_COM-VRSN",
  status: ["client delete prohibited", "client transfer prohibited", "client update prohibited"],
  events: [
    { eventAction: "registration", eventDate: "1995-08-14T04:00:00Z" },
    { eventAction: "expiration", eventDate: "2027-08-13T04:00:00Z" },
    { eventAction: "last changed", eventDate: "2026-01-16T18:26:50Z" },
    { eventAction: "last update of RDAP database", eventDate: "2026-10-10T20:00:00Z" },
  ],
  nameservers: [
    { ldhName: "A.IANA-SERVERS.NET" },
    { ldhName: "NS1.EXAMPLE.COM", ipAddresses: { v4: ["192.0.2.1"], v6: ["2001:db8::1"] } },
  ],
  secureDNS: { delegationSigned: true, dsData: [{ keyTag: 370, algorithm: 13, digestType: 2, digest: "be74359954660069d5c63d200c39f5603827d7dd02b56f120ee9f3a86764247c" }] },
  entities: [
    {
      roles: ["registrar"],
      publicIds: [{ type: "IANA Registrar ID", identifier: "376" }],
      vcardArray: card([["fn", {}, "text", "RESERVED-Internet Assigned Numbers Authority"], ["url", {}, "uri", "https://www.iana.org"]]),
      entities: [{ roles: ["abuse"], vcardArray: card([["fn", {}, "text", ""], ["tel", { type: "voice" }, "uri", "tel:+1.3103015800"], ["email", {}, "text", "abuse@iana.org"]]) }],
    },
    {
      roles: ["registrant"],
      status: ["removed"],
      vcardArray: card([["fn", {}, "text", "REDACTED FOR PRIVACY"], ["org", {}, "text", ["REDACTED FOR PRIVACY"]]]),
    },
    {
      roles: ["technical"],
      vcardArray: card([["fn", {}, "text", "Tech Person"], ["email", {}, "text", "tech@example.com"], ["adr", { cc: "US" }, "text", ["", "", "1 Main St", "Town", "CA", "90000", "United States"]]]),
    },
  ],
  notices: [{ title: "Terms of Use", description: ["Service subject to Terms of Use."] }],
  remarks: [{ title: "Data Policy", description: ["Some data was redacted."] }],
  port43: "whois.verisign-grs.com",
};

test("RDAP: core fields, dates and registrar", () => {
  const result = parseRdap(comLike, "example.com", "rdap.verisign.com");
  assert.equal(result.domain, "example.com");
  assert.equal(result.server, "rdap.verisign.com");
  assert.equal(result.handle, "2336799_DOMAIN_COM-VRSN");
  assert.equal(result.created, "1995-08-14T04:00:00.000Z");
  assert.equal(result.expires, "2027-08-13T04:00:00.000Z");
  assert.equal(result.updated, "2026-01-16T18:26:50.000Z");
  assert.equal(result.registryUpdated, "2026-10-10T20:00:00.000Z");
  assert.equal(result.registrar, "RESERVED-Internet Assigned Numbers Authority");
  assert.deepEqual(result.registrarInfo, {
    name: "RESERVED-Internet Assigned Numbers Authority",
    ianaId: "376",
    url: "https://www.iana.org",
    whoisServer: null,
    abuseEmail: "abuse@iana.org",
    abusePhone: "+1.3103015800",
  });
});

test("RDAP: statuses are explained, name servers keep their addresses", () => {
  const result = parseRdap(comLike, "example.com");
  assert.deepEqual(result.statusInfo.map((status) => status.label), ["Delete lock", "Transfer lock", "Update lock"]);
  assert.ok(result.statusInfo.every((status) => status.severity === "lock" && status.explanation));
  assert.deepEqual(result.nameservers, ["a.iana-servers.net", "ns1.example.com"]);
  assert.deepEqual(result.nameserverInfo[1], { host: "ns1.example.com", ips: ["192.0.2.1", "2001:db8::1"] });
});

test("RDAP: DNSSEC records get readable algorithm names", () => {
  const result = parseRdap(comLike, "example.com");
  assert.equal(result.dnssec, true);
  assert.deepEqual(result.dsRecords, [
    { keyTag: 370, algorithm: 13, algorithmName: "ECDSA P-256/SHA-256", digestType: 2, digestTypeName: "SHA-256", digest: "BE74359954660069D5C63D200C39F5603827D7DD02B56F120EE9F3A86764247C" },
  ]);
});

test("RDAP: redacted contacts are flagged and never show placeholder text", () => {
  const result = parseRdap(comLike, "example.com");
  const registrant = result.contacts.find((contact) => contact.role === "registrant");
  assert.equal(registrant?.redacted, true);
  assert.equal(registrant?.name, null);
  assert.equal(registrant?.organization, null);
  const technical = result.contacts.find((contact) => contact.role === "technical");
  assert.equal(technical?.email, "tech@example.com");
  assert.equal(technical?.country, "US");
  assert.equal(technical?.redacted, false);
  assert.equal(result.redacted, true);
  assert.equal(result.contacts.some((contact) => contact.role === "abuse"), false);
  assert.ok(result.notices.some((notice) => notice.title === "Data Policy"));
});

test("RDAP: missing optional parts do not break parsing", () => {
  const result = parseRdap({ ldhName: "minimal.example" }, "minimal.example");
  assert.equal(result.registered, true);
  assert.deepEqual([result.created, result.expires, result.registrar, result.dnssec], [null, null, null, null]);
  assert.deepEqual([result.status, result.nameservers, result.dsRecords, result.contacts], [[], [], [], []]);
});
