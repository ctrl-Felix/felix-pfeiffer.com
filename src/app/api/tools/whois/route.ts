import { lookupRoute } from "@/lib/lookupRoute";
import { lookupDomain, normalizeDomain } from "@/lib/whois";

export const GET = lookupRoute({
  bucket: "whois",
  perIp: 12,
  param: "domain",
  normalize: normalizeDomain,
  invalid: "Enter a valid domain name, for example example.com.",
  lookup: lookupDomain,
});
