import { logSearchFailure, searchDatabase, searchWebsite, TooManyCertificatesError, type CrtEntry, type DatabaseQuery, type Fetcher } from "./certificateSearch";
import { normalizeDnsName } from "./dnsLookup";
import { probeCommonSubdomains, type ProbeResolver, type ProbeResult } from "./subdomainProbe";
import { normalizeDomain } from "./whois";

export { TooManyCertificatesError } from "./certificateSearch";

export type Subdomain = {
  name: string;
  wildcard: boolean;
  certificates: number;
  firstSeen: string | null;
  lastExpires: string | null;
  current: boolean;
  foundInDns: boolean;
};

export type CertificateStatus = "complete" | "incomplete" | "unexpired" | "too-many" | "failed";

export type SubdomainResult = {
  domain: string;
  certificateSearch: CertificateStatus;
  certificateSource: "database" | "website" | null;
  certificates: number;
  subdomains: Subdomain[];
  issuers: { name: string; certificates: number }[];
  truncated: boolean;
  dnsCheck: { checked: number; found: number; wildcardDns: boolean } | null;
};

type SubdomainSources = { query?: DatabaseQuery; fetcher?: Fetcher; resolver?: ProbeResolver };

type CertificateOutcome = { status: CertificateStatus; source: SubdomainResult["certificateSource"]; entries: CrtEntry[] };

const maxNames = 5000;
const cacheTtlMs = 30 * 60_000;
const failedCacheTtlMs = 2 * 60_000;
const maxCacheEntries = 50;
const labelPattern = /^_?[a-z0-9]([a-z0-9_-]{0,61}[a-z0-9])?$/;

const cache = new Map<string, { expires: number; value: SubdomainResult }>();
const inFlight = new Map<string, Promise<SubdomainResult>>();

export function normalizeSubdomainQuery(input: string) {
  const cleaned = input.trim().replace(/^(\*|%)\./, "");
  const domain = normalizeDomain(cleaned);
  return domain ? normalizeDnsName(domain) : null;
}

const isoDate = (value: unknown) => {
  if (typeof value !== "string") return null;
  const time = Date.parse(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
};

export function issuerOrganization(issuer: unknown) {
  if (typeof issuer !== "string") return "Unknown";
  const organization = issuer.match(/(?:^|,\s*)O=("([^"]*)"|[^,]*)/);
  const common = issuer.match(/(?:^|,\s*)CN=("([^"]*)"|[^,]*)/);
  return (organization?.[2] ?? organization?.[1] ?? common?.[2] ?? common?.[1] ?? "Unknown").trim() || "Unknown";
}

function namesOf(entry: CrtEntry, domain: string) {
  const values = [entry.common_name, ...(typeof entry.name_value === "string" ? entry.name_value.split("\n") : [])];
  const names = new Map<string, boolean>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    let name = value.trim().toLowerCase().replace(/\.$/, "");
    const wildcard = name.startsWith("*.");
    if (wildcard) name = name.slice(2);
    if (name !== domain && !name.endsWith(`.${domain}`)) continue;
    if (name.length > 253 || !name.split(".").every((label) => labelPattern.test(label))) continue;
    names.set(name, (names.get(name) ?? false) || wildcard);
  }
  return names;
}

const reversedLabels = (name: string) => name.split(".").reverse().join(".");

function summarizeCertificates(domain: string, entries: CrtEntry[], now = Date.now()) {
  const found = new Map<string, Subdomain>();
  const seenIds = new Map<string, Set<string>>();
  const issuers = new Map<string, Set<string>>();
  const certificateIds = new Set<string>();

  entries.forEach((entry, index) => {
    const id = typeof entry.id === "number" || typeof entry.id === "string" ? String(entry.id) : `entry-${index}`;
    const notBefore = isoDate(entry.not_before);
    const notAfter = isoDate(entry.not_after);
    const current = notAfter !== null && Date.parse(notAfter) > now && (notBefore === null || Date.parse(notBefore) <= now);
    const names = namesOf(entry, domain);
    if (!names.size) return;
    certificateIds.add(id);
    const issuer = issuerOrganization(entry.issuer_name);
    issuers.set(issuer, (issuers.get(issuer) ?? new Set()).add(id));

    for (const [name, wildcard] of names) {
      const item = found.get(name) ?? { name, wildcard: false, certificates: 0, firstSeen: null, lastExpires: null, current: false, foundInDns: false };
      const ids = seenIds.get(name) ?? new Set<string>();
      if (!ids.has(id)) item.certificates += 1;
      seenIds.set(name, ids.add(id));
      item.wildcard ||= wildcard;
      item.current ||= current;
      if (notBefore && (!item.firstSeen || notBefore < item.firstSeen)) item.firstSeen = notBefore;
      if (notAfter && (!item.lastExpires || notAfter > item.lastExpires)) item.lastExpires = notAfter;
      found.set(name, item);
    }
  });

  return {
    names: found,
    certificates: certificateIds.size,
    issuers: [...issuers.entries()].map(([name, ids]) => ({ name, certificates: ids.size })).sort((a, b) => b.certificates - a.certificates || a.name.localeCompare(b.name)),
  };
}

export function buildResult(domain: string, outcome: CertificateOutcome, probe: ProbeResult | null, now = Date.now()): SubdomainResult {
  const summary = summarizeCertificates(domain, outcome.entries, now);
  for (const name of probe?.found ?? []) {
    const item = summary.names.get(name) ?? { name, wildcard: false, certificates: 0, firstSeen: null, lastExpires: null, current: false, foundInDns: false };
    summary.names.set(name, { ...item, foundInDns: true });
  }
  const sorted = [...summary.names.values()].sort((a, b) => reversedLabels(a.name).localeCompare(reversedLabels(b.name)));
  return {
    domain,
    certificateSearch: outcome.status,
    certificateSource: outcome.source,
    certificates: summary.certificates,
    subdomains: sorted.slice(0, maxNames),
    issuers: summary.issuers,
    truncated: sorted.length > maxNames,
    dnsCheck: probe && { checked: probe.checked, found: probe.found.length, wildcardDns: probe.wildcardDns },
  };
}

async function searchCertificates(domain: string, sources: SubdomainSources): Promise<CertificateOutcome> {
  try {
    const result = await searchDatabase(domain, sources.query);
    return { status: result.complete ? "complete" : "incomplete", source: "database", entries: result.entries };
  } catch (error) {
    logSearchFailure("database", error);
  }
  const fetcher = sources.fetcher ?? fetch;
  try {
    return { status: "complete", source: "website", entries: (await searchWebsite(domain, false, fetcher)).entries };
  } catch (error) {
    if (!(error instanceof TooManyCertificatesError)) {
      logSearchFailure("website", error);
      return { status: "failed", source: null, entries: [] };
    }
  }
  try {
    return { status: "unexpired", source: "website", entries: (await searchWebsite(domain, true, fetcher)).entries };
  } catch (error) {
    if (error instanceof TooManyCertificatesError) return { status: "too-many", source: null, entries: [] };
    logSearchFailure("website", error);
    return { status: "failed", source: null, entries: [] };
  }
}

async function discover(domain: string, sources: SubdomainSources) {
  const [outcome, probe] = await Promise.all([searchCertificates(domain, sources), probeCommonSubdomains(domain, sources.resolver).catch(() => null)]);
  const certificatesMissing = outcome.status === "failed" || outcome.status === "too-many";
  if (certificatesMissing && !probe) throw outcome.status === "too-many" ? new TooManyCertificatesError("too many certificates") : new Error("no source answered");
  return buildResult(domain, outcome, probe);
}

export async function findSubdomains(domain: string, sources: SubdomainSources = {}): Promise<SubdomainResult> {
  const hit = cache.get(domain);
  if (hit && hit.expires > Date.now()) return hit.value;
  const running = inFlight.get(domain);
  if (running) return running;

  const promise = discover(domain, sources)
    .then((value) => {
      if (cache.size >= maxCacheEntries) cache.clear();
      const ttl = value.certificateSearch === "failed" ? failedCacheTtlMs : cacheTtlMs;
      cache.set(domain, { expires: Date.now() + ttl, value });
      return value;
    })
    .finally(() => inFlight.delete(domain));
  inFlight.set(domain, promise);
  return promise;
}
