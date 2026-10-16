import { normalizeIp } from "@/lib/ipAddress";
import { lookupIp } from "@/lib/ipLookup";
import { lookupRoute } from "@/lib/lookupRoute";

export const GET = lookupRoute({
  bucket: "ip",
  perIp: 20,
  global: 200,
  param: "ip",
  normalize: normalizeIp,
  invalid: "Enter a public IPv4 or IPv6 address, for example 1.1.1.1.",
  lookup: (address) => lookupIp(address.ip, address.version),
});
