import { lookupDns, normalizeDnsName } from "@/lib/dnsLookup";
import { lookupRoute } from "@/lib/lookupRoute";

export const GET = lookupRoute({
  bucket: "dns",
  perIp: 20,
  param: "domain",
  normalize: normalizeDnsName,
  invalid: "Enter a valid public domain name, for example example.com.",
  lookup: (domain) => lookupDns(domain),
});
