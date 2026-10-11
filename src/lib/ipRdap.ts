import { asArray, asString, eventDate, flattenEntities, readCard } from "./rdapParser";
import { containsIp, type IpVersion } from "./ipAddress";

type Json = Record<string, unknown>;
type Bootstrap = { services: [string[], string[]][] };
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export type IpNetwork = {
  handle: string | null;
  name: string | null;
  type: string | null;
  range: string | null;
  cidrs: string[];
  country: string | null;
  parentHandle: string | null;
  status: string[];
  registered: string | null;
  updated: string | null;
  organization: { name: string | null; handle: string | null; address: string | null; country: string | null } | null;
  abuse: { email: string | null; phone: string | null } | null;
  remarks: string[];
  registry: string | null;
  server: string;
};

const bootstrapUrls: Record<IpVersion, string> = { 4: "https://data.iana.org/rdap/ipv4.json", 6: "https://data.iana.org/rdap/ipv6.json" };
const timeoutMs = 8000;
const maxJsonChars = 512 * 1024;
const bootstrapTtlMs = 24 * 60 * 60_000;
const maxRedirects = 2;
const maxRemarks = 4;
const registries: Record<string, string> = { "rdap.arin.net": "ARIN", "rdap.db.ripe.net": "RIPE NCC", "rdap.apnic.net": "APNIC", "rdap.lacnic.net": "LACNIC", "rdap.afrinic.net": "AFRINIC" };

const bootstrapCache = new Map<IpVersion, { expires: number; value: Bootstrap }>();

async function readJson(response: Response) {
  const text = await response.text();
  if (text.length > maxJsonChars) throw new Error("response too large");
  return JSON.parse(text) as Json;
}

async function loadBootstrap(version: IpVersion, fetcher: Fetcher) {
  const hit = bootstrapCache.get(version);
  if (hit && hit.expires > Date.now()) return hit.value;
  const response = await fetcher(bootstrapUrls[version], { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!response.ok) throw new Error("bootstrap unavailable");
  const value = (await readJson(response)) as unknown as Bootstrap;
  bootstrapCache.set(version, { expires: Date.now() + bootstrapTtlMs, value });
  return value;
}

export function rdapServerFor(ip: string, version: IpVersion, bootstrap: Bootstrap) {
  let best: { length: number; url: string } | null = null;
  for (const [prefixes, urls] of bootstrap.services) {
    const url = urls.find((candidate) => candidate.startsWith("https://"));
    if (!url) continue;
    for (const prefix of prefixes) {
      const length = Number(prefix.split("/")[1]);
      if ((!best || length > best.length) && containsIp(prefix, ip, version)) best = { length, url: url.endsWith("/") ? url : `${url}/` };
    }
  }
  return best?.url ?? null;
}

const allowedHosts = (bootstrap: Bootstrap) => new Set(bootstrap.services.flatMap(([, urls]) => urls.filter((url) => url.startsWith("https://")).map((url) => new URL(url).hostname)));

async function fetchRdap(url: string, hosts: Set<string>, fetcher: Fetcher) {
  let target = url;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const response = await fetcher(target, { headers: { Accept: "application/rdap+json, application/json" }, redirect: "manual", signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get("location") ?? "", target);
      if (next.protocol !== "https:" || !hosts.has(next.hostname)) throw new Error("redirect not allowed");
      target = next.toString();
      continue;
    }
    if (!response.ok) throw new Error(`registry answered ${response.status}`);
    return { json: await readJson(response), server: new URL(target).hostname };
  }
  throw new Error("too many redirects");
}

const hasRole = (entity: Json, role: string) => Array.isArray(entity.roles) && entity.roles.includes(role);

export function parseIpNetwork(json: Json, server: string): IpNetwork {
  const entities = flattenEntities(asArray(json.entities));
  const owner = entities.find((entity) => hasRole(entity, "registrant")) ?? entities.find((entity) => hasRole(entity, "administrative"));
  const ownerCard = owner ? readCard(owner) : null;
  const abuseEntity = entities.find((entity) => hasRole(entity, "abuse"));
  const abuseCard = abuseEntity ? readCard(abuseEntity) : null;
  const start = asString(json.startAddress);
  const end = asString(json.endAddress);
  const cidrs = asArray(json.cidr0_cidrs).flatMap((entry) => {
    const network = asString(entry.v4prefix) ?? asString(entry.v6prefix);
    return network && typeof entry.length === "number" ? [`${network}/${entry.length}`] : [];
  });
  const remarks = asArray(json.remarks)
    .flatMap((remark) => (Array.isArray(remark.description) ? remark.description.map(String) : []))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, maxRemarks);

  return {
    handle: asString(json.handle),
    name: asString(json.name),
    type: asString(json.type),
    range: start && end ? `${start} - ${end}` : null,
    cidrs,
    country: asString(json.country)?.toUpperCase() ?? null,
    parentHandle: asString(json.parentHandle),
    status: Array.isArray(json.status) ? json.status.map(String) : [],
    registered: eventDate(json, "registration"),
    updated: eventDate(json, "last changed"),
    organization: owner && ownerCard ? { name: ownerCard.org ?? ownerCard.fn, handle: asString(owner.handle), address: ownerCard.address, country: ownerCard.country?.toUpperCase() ?? null } : null,
    abuse: abuseCard && (abuseCard.email || abuseCard.tel) ? { email: abuseCard.email, phone: abuseCard.tel } : null,
    remarks,
    registry: registries[server] ?? null,
    server,
  };
}

export async function lookupIpNetwork(ip: string, version: IpVersion, fetcher: Fetcher = fetch): Promise<IpNetwork | null> {
  const bootstrap = await loadBootstrap(version, fetcher);
  const base = rdapServerFor(ip, version, bootstrap);
  if (!base) return null;
  const { json, server } = await fetchRdap(`${base}ip/${encodeURIComponent(ip)}`, allowedHosts(bootstrap), fetcher);
  return parseIpNetwork(json, server);
}
