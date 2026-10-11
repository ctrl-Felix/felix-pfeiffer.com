import assert from "node:assert/strict";
import { test } from "node:test";
import { lookupAsn, lookupIp, type IpResolver } from "./ipLookup";

const missing = () => {
  throw Object.assign(new Error("ENOTFOUND"), { code: "ENOTFOUND" });
};
const timeout = () => {
  throw Object.assign(new Error("ETIMEOUT"), { code: "ETIMEOUT" });
};

const resolver: IpResolver = {
  resolveTxt: async (name) => {
    if (name === "1.1.1.1.origin.asn.cymru.com") return [["13335 | 1.1.1.0/24 | AU | apnic | 2011-08-11"], ["13335 | 1.0.0.0/8 | AU | apnic | "]];
    if (name === "AS13335.asn.cymru.com") return [["13335 | US | arin | 2010-07-14 | CLOUDFLARENET - Cloudflare, Inc., US"]];
    if (name.endsWith(".origin6.asn.cymru.com")) return [["15169 | 2001:4860::/32 | US | ", "arin | 2005-03-14"]];
    return missing();
  },
  reverse: async (ip) => (ip === "1.1.1.1" ? ["One.One.One.One."] : missing()),
};

test("the origin ASN, its name and the most specific prefix are read from Team Cymru", async () => {
  assert.deepEqual(await lookupAsn("1.1.1.1", 4, resolver), {
    asn: 13335,
    name: "CLOUDFLARENET - Cloudflare, Inc., US",
    prefix: "1.1.1.0/24",
    country: "AU",
    registry: "APNIC",
    allocated: "2011-08-11",
  });
  const v6 = await lookupAsn("2001:4860::8888", 6, resolver);
  assert.equal(v6?.asn, 15169);
  assert.equal(v6?.name, null);
  assert.equal(v6?.registry, "ARIN");
  assert.equal(await lookupAsn("5.5.5.5", 4, resolver), null);
});

test("a lookup combines the parts and reports the ones that failed", async () => {
  const down = async () => new Response("", { status: 503 });
  const result = await lookupIp("1.1.1.1", 4, { resolver, fetcher: down });
  assert.deepEqual(result.reverseDns, ["one.one.one.one"]);
  assert.equal(result.asn?.asn, 13335);
  assert.equal(result.network, null);
  assert.deepEqual(result.failed, ["registry"]);

  await assert.rejects(lookupIp("9.9.9.9", 4, { fetcher: down, resolver: { resolveTxt: async () => timeout(), reverse: async () => timeout() } }), /no source answered/);
});
