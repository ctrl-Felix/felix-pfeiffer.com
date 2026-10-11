import assert from "node:assert/strict";
import { test } from "node:test";
import { lookupIpNetwork, parseIpNetwork, rdapServerFor } from "./ipRdap";

const bootstrap = {
  services: [
    [["1.0.0.0/8"], ["https://rdap.apnic.net/"]],
    [["8.0.0.0/8"], ["http://rdap.arin.net/registry/", "https://rdap.arin.net/registry/"]],
    [["8.8.0.0/16"], ["https://rdap.db.ripe.net/"]],
  ] as [string[], string[]][],
};

const network = {
  handle: "NET-8-8-8-0-1",
  name: "GOGL",
  type: "DIRECT ALLOCATION",
  startAddress: "8.8.8.0",
  endAddress: "8.8.8.255",
  cidr0_cidrs: [{ v4prefix: "8.8.8.0", length: 24 }],
  country: "us",
  parentHandle: "NET-8-0-0-0-0",
  status: ["active"],
  events: [
    { eventAction: "registration", eventDate: "2014-03-14T16:52:05-04:00" },
    { eventAction: "last changed", eventDate: "2014-03-14T16:52:05-04:00" },
  ],
  remarks: [{ description: ["Some   remark", "Second line"] }],
  entities: [
    {
      handle: "GOGL",
      roles: ["registrant"],
      vcardArray: ["vcard", [["fn", {}, "text", "Google LLC"], ["adr", { label: "1600 Amphitheatre Parkway\nMountain View\nCA\n94043\nUnited States", cc: "US" }, "text", ["", "", "", "", "", "", ""]]]],
      entities: [{ roles: ["abuse"], vcardArray: ["vcard", [["fn", {}, "text", "Abuse"], ["email", {}, "text", "network-abuse@google.com"], ["tel", {}, "text", "+1-650-253-0000"]]] }],
    },
  ],
};

test("the most specific https RDAP server is chosen", () => {
  assert.equal(rdapServerFor("8.8.8.8", 4, bootstrap), "https://rdap.db.ripe.net/");
  assert.equal(rdapServerFor("8.1.1.1", 4, bootstrap), "https://rdap.arin.net/registry/");
  assert.equal(rdapServerFor("9.9.9.9", 4, bootstrap), null);
});

test("an RDAP network is read with owner, address, abuse contact and CIDR", () => {
  const result = parseIpNetwork(network, "rdap.arin.net");
  assert.equal(result.name, "GOGL");
  assert.equal(result.range, "8.8.8.0 - 8.8.8.255");
  assert.deepEqual(result.cidrs, ["8.8.8.0/24"]);
  assert.equal(result.country, "US");
  assert.equal(result.registry, "ARIN");
  assert.equal(result.registered, "2014-03-14T20:52:05.000Z");
  assert.deepEqual(result.organization, { name: "Google LLC", handle: "GOGL", address: "1600 Amphitheatre Parkway, Mountain View, CA, 94043, United States", country: "US" });
  assert.deepEqual(result.abuse, { email: "network-abuse@google.com", phone: "+1-650-253-0000" });
  assert.deepEqual(result.remarks, ["Some remark", "Second line"]);
});

const isBootstrap = (url: string) => new URL(url).hostname === "data.iana.org";
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

test("registry redirects are followed only to registry hosts", async () => {
  const asked: string[] = [];
  const fetcher = async (url: string) => {
    asked.push(url);
    if (isBootstrap(url)) return json(bootstrap);
    if (url.startsWith("https://rdap.apnic.net/")) return new Response(null, { status: 301, headers: { location: "https://rdap.arin.net/registry/ip/1.1.1.1" } });
    return json(network);
  };
  const result = await lookupIpNetwork("1.1.1.1", 4, fetcher);
  assert.equal(result?.registry, "ARIN");
  assert.deepEqual(asked.slice(1), ["https://rdap.apnic.net/ip/1.1.1.1", "https://rdap.arin.net/registry/ip/1.1.1.1"]);

  const evil = async (url: string) => (isBootstrap(url) ? json(bootstrap) : new Response(null, { status: 302, headers: { location: "https://169.254.169.254/latest" } }));
  await assert.rejects(lookupIpNetwork("1.0.0.1", 4, evil), /redirect not allowed/);
});
