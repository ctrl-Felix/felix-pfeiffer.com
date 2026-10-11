import { normalizeDnsName } from "./dnsLookup";
import { normalizeDomain } from "./whois";

export type Subdomain = {
  name: string;
  wildcard: boolean;
  certificates: number;
  firstSeen: string | null;
  lastExpires: string | null;
  current: boolean;
};

export type SubdomainResult = {
  domain: string;
  scope: "all" | "unexpired";
  certificates: number;
  subdomains: Subdomain[];
  issuers: { name: string; certificates: number }[];
  truncated: boolean;
};

type CrtEntry = { id?: unknown; issuer_name?: unknown; common_name?: unknown; name_value?: unknown; not_before?: unknown; not_after?: unknown };
type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export class TooManyCertificatesError extends Error {}

const searchUrl = "https://crt.sh/";
const timeoutMs = 25_000;
const maxResponseBytes = 12 * 1024 * 1024;
const maxNames = 5000;
const cacheTtlMs = 30 * 60_000;
const maxCacheEntries = 50;
const labelPattern = /^_?[a-z0-9]([a-z0-9_-]{0,61}[a-z0-9])?$/;

const cache = new Map<string, { expires: number; value: SubdomainResult }>();
const inFlight = new Map<string, Promise<SubdomainResult>>();

export function normalizeSubdomainQuery(input: string) {
  const cleaned = input.trim().replace(/^(\*|%)\./, "");
  const domain = normalizeDomain(cleaned);
  return domain ? normalizeDnsName(domain) : null;
}

async function readCapped(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxResponseBytes) {
      await reader.cancel();
      throw new TooManyCertificatesError("response too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function searchLogs(domain: string, unexpiredOnly: boolean, fetcher: Fetcher): Promise<CrtEntry[]> {
  const params = new URLSearchParams({ q: `%.${domain}`, output: "json", deduplicate: "Y" });
  if (unexpiredOnly) params.set("exclude", "expired");
  const response = await fetcher(`${searchUrl}?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`certificate search failed with ${response.status}`);
  const text = (await readCapped(response)).trim();
  if (!text) return [];
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("unexpected certificate search response");
  return parsed as CrtEntry[];
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

export function summarizeCertificates(domain: string, entries: CrtEntry[], scope: SubdomainResult["scope"], now = Date.now()): SubdomainResult {
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
      const item = found.get(name) ?? { name, wildcard: false, certificates: 0, firstSeen: null, lastExpires: null, current: false };
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

  const sorted = [...found.values()].sort((a, b) => reversedLabels(a.name).localeCompare(reversedLabels(b.name)));

  return {
    domain,
    scope,
    certificates: certificateIds.size,
    subdomains: sorted.slice(0, maxNames),
    issuers: [...issuers.entries()].map(([name, ids]) => ({ name, certificates: ids.size })).sort((a, b) => b.certificates - a.certificates || a.name.localeCompare(b.name)),
    truncated: sorted.length > maxNames,
  };
}

async function discover(domain: string, fetcher: Fetcher): Promise<SubdomainResult> {
  try {
    return summarizeCertificates(domain, await searchLogs(domain, false, fetcher), "all");
  } catch (error) {
    if (!(error instanceof TooManyCertificatesError)) throw error;
    return summarizeCertificates(domain, await searchLogs(domain, true, fetcher), "unexpired");
  }
}

export async function findSubdomains(domain: string, fetcher: Fetcher = fetch): Promise<SubdomainResult> {
  const hit = cache.get(domain);
  if (hit && hit.expires > Date.now()) return hit.value;
  const running = inFlight.get(domain);
  if (running) return running;

  const promise = discover(domain, fetcher)
    .then((value) => {
      if (cache.size >= maxCacheEntries) cache.clear();
      cache.set(domain, { expires: Date.now() + cacheTtlMs, value });
      return value;
    })
    .finally(() => inFlight.delete(domain));
  inFlight.set(domain, promise);
  return promise;
}
