import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import { domainToASCII } from "node:url";

export const recordTypes = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA"] as const;
export type RecordType = (typeof recordTypes)[number];

export type DnsRecords = {
  A?: { address: string; ttl: number }[];
  AAAA?: { address: string; ttl: number }[];
  CNAME?: string[];
  MX?: { priority: number; exchange: string }[];
  NS?: string[];
  TXT?: string[];
  SOA?: { primaryNameserver: string; hostmaster: string; serial: number; refresh: number; retry: number; expire: number; minimumTtl: number } | null;
  CAA?: { critical: boolean; tag: string; value: string }[];
};

export type DnsResult = {
  domain: string;
  exists: boolean;
  records: DnsRecords;
  failures: Partial<Record<RecordType, string>>;
};

export type DnsResolver = Pick<Resolver, "resolve4" | "resolve6" | "resolveCname" | "resolveMx" | "resolveNs" | "resolveTxt" | "resolveSoa" | "resolveCaa">;

const defaultServers = ["1.1.1.1", "8.8.8.8", "9.9.9.9"];
const cacheTtlMs = 60_000;
const maxCacheEntries = 200;
const labelPattern = /^_?[a-z0-9]([a-z0-9_-]{0,61}[a-z0-9])?$/;
const emptyCodes = new Set(["ENODATA", "ENOTFOUND"]);

const cache = new Map<string, { expires: number; value: DnsResult }>();

export function normalizeDnsName(input: string) {
  const value = input.trim().toLowerCase().replace(/\.$/, "");
  if (!value || value.length > 253 || /[\s/:@?#]/.test(value)) return null;
  const ascii = domainToASCII(value);
  if (!ascii || ascii.length > 253) return null;
  const labels = ascii.split(".");
  if (labels.length < 2 || !labels.every((label) => labelPattern.test(label))) return null;
  if (/^[0-9]+$/.test(labels[labels.length - 1]) || isIP(ascii)) return null;
  if (/\.(localhost|local|internal|lan|home|corp|intranet|invalid|localdomain)$/.test(ascii)) return null;
  return ascii;
}

const isResolverAddress = (value: string) => {
  const bracketed = value.match(/^\[([0-9a-f:]+)\](?::\d{1,5})?$/i);
  const withPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d{1,5}$/);
  return isIP(bracketed?.[1] ?? withPort?.[1] ?? value) !== 0;
};

export function publicResolver(servers = (process.env.DNS_RESOLVERS ?? "").split(",").map((entry) => entry.trim()).filter(Boolean)) {
  const chosen = servers.length && servers.every(isResolverAddress) ? servers : defaultServers;
  const resolver = new Resolver({ timeout: 3000, tries: 2 });
  resolver.setServers(chosen);
  return resolver;
}

const errorCode = (error: unknown) => (typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : "UNKNOWN");

const caaValue = (record: Record<string, unknown>) => {
  const tag = ["issue", "issuewild", "iodef", "contactemail", "contactphone"].find((name) => typeof record[name] === "string");
  return { critical: Number(record.critical ?? 0) > 0, tag: tag ?? "unknown", value: tag ? String(record[tag]) : "" };
};

async function fetchType(type: RecordType, domain: string, resolver: DnsResolver): Promise<DnsRecords[RecordType]> {
  switch (type) {
    case "A":
      return (await resolver.resolve4(domain, { ttl: true })).map(({ address, ttl }) => ({ address, ttl }));
    case "AAAA":
      return (await resolver.resolve6(domain, { ttl: true })).map(({ address, ttl }) => ({ address, ttl }));
    case "CNAME":
      return (await resolver.resolveCname(domain)).map((name) => name.toLowerCase());
    case "MX":
      return (await resolver.resolveMx(domain)).map(({ priority, exchange }) => ({ priority, exchange: exchange.toLowerCase() })).sort((a, b) => a.priority - b.priority);
    case "NS":
      return (await resolver.resolveNs(domain)).map((name) => name.toLowerCase()).sort();
    case "TXT":
      return (await resolver.resolveTxt(domain)).map((chunks) => chunks.join(""));
    case "SOA": {
      const soa = await resolver.resolveSoa(domain);
      return { primaryNameserver: soa.nsname, hostmaster: soa.hostmaster, serial: soa.serial, refresh: soa.refresh, retry: soa.retry, expire: soa.expire, minimumTtl: soa.minttl };
    }
    case "CAA":
      return (await resolver.resolveCaa(domain)).map((record) => caaValue(record as unknown as Record<string, unknown>));
  }
}

export async function lookupDns(domain: string, types: readonly RecordType[] = recordTypes, resolver: DnsResolver = publicResolver()): Promise<DnsResult> {
  const key = `${domain}|${[...types].sort().join(",")}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const records: DnsRecords = {};
  const failures: DnsResult["failures"] = {};
  const missing = new Set<RecordType>();
  await Promise.all(
    types.map(async (type) => {
      try {
        (records as Record<string, unknown>)[type] = await fetchType(type, domain, resolver);
      } catch (error) {
        const code = errorCode(error);
        if (code === "ENOTFOUND") missing.add(type);
        if (!emptyCodes.has(code)) failures[type] = code;
        (records as Record<string, unknown>)[type] = type === "SOA" ? null : [];
      }
    }),
  );

  const allFailed = types.every((type) => failures[type]);
  if (allFailed) throw new Error("resolver unavailable");
  const exists = missing.size < types.length;
  const result: DnsResult = { domain, exists, records: sortRecords(records, types), failures };
  if (cache.size >= maxCacheEntries) cache.clear();
  cache.set(key, { expires: Date.now() + cacheTtlMs, value: result });
  return result;
}

function sortRecords(records: DnsRecords, types: readonly RecordType[]) {
  const ordered: DnsRecords = {};
  for (const type of recordTypes) if (types.includes(type)) (ordered as Record<string, unknown>)[type] = records[type];
  return ordered;
}
