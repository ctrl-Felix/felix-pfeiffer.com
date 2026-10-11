import { publicResolver } from "./dnsLookup";
import { reverseLabels, type IpVersion } from "./ipAddress";
import { lookupIpNetwork, type Fetcher, type IpNetwork } from "./ipRdap";

export type IpResolver = { resolveTxt: (name: string) => Promise<string[][]>; reverse: (ip: string) => Promise<string[]> };
export type IpSources = { fetcher?: Fetcher; resolver?: IpResolver };

export type AsnInfo = { asn: number; name: string | null; prefix: string | null; country: string | null; registry: string | null; allocated: string | null };

export type IpResult = {
  ip: string;
  version: IpVersion;
  reverseDns: string[];
  asn: AsnInfo | null;
  network: IpNetwork | null;
  failed: ("registry" | "routing" | "reverseDns")[];
};

const cacheTtlMs = 10 * 60_000;
const maxCacheEntries = 500;
const cache = new Map<string, { expires: number; value: IpResult }>();

const missingCodes = new Set(["ENOTFOUND", "ENODATA"]);
const isMissing = (error: unknown) => missingCodes.has(String((error as { code?: unknown })?.code));

const cymruFields = (records: string[][]) => records.map((chunks) => chunks.join("").split("|").map((field) => field.trim()));

export async function lookupAsn(ip: string, version: IpVersion, resolver: IpResolver): Promise<AsnInfo | null> {
  const zone = version === 4 ? "origin.asn.cymru.com" : "origin6.asn.cymru.com";
  let origins: string[][];
  try {
    origins = cymruFields(await resolver.resolveTxt(`${reverseLabels(ip, version)}.${zone}`));
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  const best = origins
    .map(([asns, prefix, country, registry, allocated]) => ({ asn: Number(asns?.split(/\s+/)[0]), prefix, country, registry, allocated }))
    .filter((origin) => Number.isInteger(origin.asn) && origin.asn > 0)
    .sort((a, b) => Number(b.prefix?.split("/")[1] ?? 0) - Number(a.prefix?.split("/")[1] ?? 0))[0];
  if (!best) return null;
  let name: string | null = null;
  try {
    const [details] = cymruFields(await resolver.resolveTxt(`AS${best.asn}.asn.cymru.com`));
    name = details?.[4] || null;
  } catch {}
  return {
    asn: best.asn,
    name,
    prefix: best.prefix || null,
    country: best.country?.toUpperCase() || null,
    registry: best.registry ? best.registry.toUpperCase().replace("RIPENCC", "RIPE NCC") : null,
    allocated: /^\d{4}-\d{2}-\d{2}$/.test(best.allocated ?? "") ? best.allocated! : null,
  };
}

async function reverseDns(ip: string, resolver: IpResolver) {
  try {
    return (await resolver.reverse(ip)).map((name) => name.toLowerCase().replace(/\.$/, "")).sort();
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
}

export async function lookupIp(ip: string, version: IpVersion, sources: IpSources = {}): Promise<IpResult> {
  const hit = cache.get(ip);
  if (hit && hit.expires > Date.now()) return hit.value;
  const resolver = sources.resolver ?? publicResolver();
  const [network, asn, names] = await Promise.allSettled([lookupIpNetwork(ip, version, sources.fetcher), lookupAsn(ip, version, resolver), reverseDns(ip, resolver)]);
  const failed: IpResult["failed"] = [];
  if (network.status === "rejected") failed.push("registry");
  if (asn.status === "rejected") failed.push("routing");
  if (names.status === "rejected") failed.push("reverseDns");
  if (failed.length === 3) throw new Error("no source answered");

  const value: IpResult = {
    ip,
    version,
    reverseDns: names.status === "fulfilled" ? names.value : [],
    asn: asn.status === "fulfilled" ? asn.value : null,
    network: network.status === "fulfilled" ? network.value : null,
    failed,
  };
  if (cache.size >= maxCacheEntries) cache.clear();
  if (!failed.length) cache.set(ip, { expires: Date.now() + cacheTtlMs, value });
  return value;
}
