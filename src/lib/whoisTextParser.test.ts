import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWhoisDate } from "./whoisDates";
import { parseWhoisText } from "./whoisTextParser";

const verisign = `   Domain Name: EXAMPLE.COM
   Registry Domain ID: 2336799_DOMAIN_COM-VRSN
   Registrar WHOIS Server: whois.registrar.example
   Registrar URL: http://www.registrar.example
   Updated Date: 2026-01-16T18:26:50Z
   Creation Date: 1995-08-14T04:00:00Z
   Registry Expiry Date: 2027-08-13T04:00:00Z
   Registrar: Example Registrar, Inc.
   Registrar IANA ID: 376
   Registrar Abuse Contact Email: abuse@registrar.example
   Registrar Abuse Contact Phone: +1.5555550100
   Domain Status: clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited
   Domain Status: clientTransferProhibited https://icann.org/epp#clientTransferProhibited
   Name Server: A.IANA-SERVERS.NET
   Name Server: B.IANA-SERVERS.NET
   DNSSEC: signedDelegation
Registrant Name: REDACTED FOR PRIVACY
Registrant Organization: REDACTED FOR PRIVACY
Registrant Country: US
Tech Email: Please query the RDDS service of the Registrar of Record
>>> Last update of whois database: 2026-10-10T20:00:00Z <<<
`;

test("WHOIS: gTLD style output with registrar details and redacted contacts", () => {
  const result = parseWhoisText(verisign, "example.com", "whois.verisign-grs.com");
  assert.equal(result.registrar, "Example Registrar, Inc.");
  assert.equal(result.registrarInfo.ianaId, "376");
  assert.equal(result.registrarInfo.abuseEmail, "abuse@registrar.example");
  assert.equal(result.registrarInfo.whoisServer, "whois.registrar.example");
  assert.equal(result.created, "1995-08-14T04:00:00.000Z");
  assert.equal(result.expires, "2027-08-13T04:00:00.000Z");
  assert.equal(result.updated, "2026-01-16T18:26:50.000Z");
  assert.deepEqual(result.status, ["clientDeleteProhibited", "clientTransferProhibited"]);
  assert.deepEqual(result.statusInfo.map((status) => status.label), ["Delete lock", "Transfer lock"]);
  assert.deepEqual(result.nameservers, ["a.iana-servers.net", "b.iana-servers.net"]);
  assert.equal(result.dnssec, true);
  assert.equal(result.handle, "2336799_DOMAIN_COM-VRSN");
  const registrant = result.contacts.find((contact) => contact.role === "registrant");
  assert.equal(registrant?.redacted, true);
  assert.equal(registrant?.name, null);
  assert.equal(registrant?.country, "US");
  assert.equal(result.redacted, true);
});

const denic = `Domain: example.de
Nserver: ns1.example.de 192.0.2.53
Nserver: ns2.example.de 2001:db8::53
Dnskey: example.de. 257 3 13 mdsswUyr3DPW132mOi8V9xESWE8jTo0dxCjjnopKl+GqJxpVXckHAeF+KkxLbxILfDLUT0rAK9iUzy1L53eKGQ==
Status: connect
Changed: 2023-03-07T14:39:21+01:00
`;

test("WHOIS: DENIC style with glue addresses and a plain status", () => {
  const result = parseWhoisText(denic, "example.de");
  assert.deepEqual(result.nameserverInfo, [
    { host: "ns1.example.de", ips: ["192.0.2.53"] },
    { host: "ns2.example.de", ips: ["2001:db8::53"] },
  ]);
  assert.equal(result.updated, "2023-03-07T13:39:21.000Z");
  assert.equal(result.statusInfo[0].label, "Active");
});

const nominet = `
    Domain name:
        example.co.uk

    Registrar:
        Example Registrar Ltd [Tag = EXAMPLE]
        URL: https://registrar.example

    Relevant dates:
        Registered on: 14-Aug-1996
        Expiry date:  14-Aug-2027
        Last updated:  02-Sep-2025

    Registration status:
        Registered until expiry date.

    Name servers:
        ns1.example.co.uk         192.0.2.1
        ns2.example.co.uk

    WHOIS lookup made at 12:00:00 10-Oct-2026
`;

test("WHOIS: Nominet style indented blocks", () => {
  const result = parseWhoisText(nominet, "example.co.uk");
  assert.equal(result.registrar, "Example Registrar Ltd");
  assert.equal(result.created, "1996-08-14T00:00:00.000Z");
  assert.equal(result.expires, "2027-08-14T00:00:00.000Z");
  assert.equal(result.updated, "2025-09-02T00:00:00.000Z");
  assert.deepEqual(result.nameserverInfo, [
    { host: "ns1.example.co.uk", ips: ["192.0.2.1"] },
    { host: "ns2.example.co.uk", ips: [] },
  ]);
});

const tci = `domain:        EXAMPLE.RU
nserver:       ns1.example.ru.
nserver:       ns2.example.ru.
state:         REGISTERED, DELEGATED, VERIFIED
registrar:     RU-CENTER-RU
created:       2000-01-02T10:00:00Z
paid-till:     2027-01-02T10:00:00Z
`;

test("WHOIS: TCI style with paid-till and trailing dots", () => {
  const result = parseWhoisText(tci, "example.ru");
  assert.equal(result.registrar, "RU-CENTER-RU");
  assert.equal(result.expires, "2027-01-02T10:00:00.000Z");
  assert.deepEqual(result.nameservers, ["ns1.example.ru", "ns2.example.ru"]);
});

const jprs = `[Domain Name]                   EXAMPLE.JP
[Registrant]                    Example Corp
[Name Server]                   ns1.example.jp
[Name Server]                   ns2.example.jp
[Created on]                    2001/03/04
[Expires on]                    2027/03/31
[Status]                        Active
[Last Updated]                  2026/04/01 01:05:04 (JST)
`;

test("WHOIS: JPRS bracket style", () => {
  const result = parseWhoisText(jprs, "example.jp");
  assert.deepEqual(result.nameservers, ["ns1.example.jp", "ns2.example.jp"]);
  assert.equal(result.created, "2001-03-04T00:00:00.000Z");
  assert.equal(result.expires, "2027-03-31T00:00:00.000Z");
  assert.equal(result.updated, "2026-04-01T01:05:04.000Z");
  assert.equal(result.statusInfo[0].label, "Active");
});

test("WHOIS dates in common registry formats", () => {
  assert.equal(parseWhoisDate("2020-01-02"), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("02-Jan-2020"), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("2020.01.02"), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("20200102 #11279"), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("2020. 01. 02."), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("02/01/2020"), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("Jan 2, 2020"), "2020-01-02T00:00:00.000Z");
  assert.equal(parseWhoisDate("2020-01-02 10:11:12"), "2020-01-02T10:11:12.000Z");
  assert.equal(parseWhoisDate("2020-01-02T10:11:12+09:00"), "2020-01-02T01:11:12.000Z");
  assert.equal(parseWhoisDate("not a date"), null);
  assert.equal(parseWhoisDate("2020-13-45"), null);
  assert.equal(parseWhoisDate(null), null);
});

test("WHOIS: output without any registration data is not useful", async () => {
  const { hasUsefulData } = await import("./whoisTextParser");
  assert.equal(hasUsefulData(parseWhoisText("WHOIS LIMIT EXCEEDED - SEE WWW.EXAMPLE.COM/WHOIS", "example.com")), false);
});
