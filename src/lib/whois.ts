import { connect } from "node:net";
import { domainToASCII } from "node:url";

export type WhoisResult = {
  domain: string;
  source: "rdap" | "whois";
  registered: boolean;
  registrar: string | null;
  created: string | null;
  updated: string | null;
  expires: string | null;
  status: string[];
  nameservers: string[];
  dnssec: boolean | null;
  raw: string;
};

type Bootstrap = { services: [string[], string[]][] };
type Attempt = WhoisResult | "unregistered" | null;

const bootstrapUrl = process.env.RDAP_BOOTSTRAP_URL ?? "https://data.iana.org/rdap/dns.json";
const rootServer = process.env.WHOIS_ROOT_SERVER ?? "whois.iana.org:43";
const rdapTestMode = Boolean(process.env.RDAP_BOOTSTRAP_URL);
const whoisTestMode = Boolean(process.env.WHOIS_ROOT_SERVER);

const timeoutMs = 8000;
const maxJsonBytes = 512 * 1024;
const maxWhoisBytes = 64 * 1024;
const maxRawChars = 20_000;
const resultTtlMs = 10 * 60_000;
const bootstrapTtlMs = 24 * 60 * 60_000;
const maxCacheEntries = 500;

const results = new Map<string, { expires: number; value: WhoisResult }>();
let bootstrapCache: { expires: number; value: Bootstrap } | null = null;

export function normalizeDomain(input: string) {
  let value = input.trim().toLowerCase();
  if (!value || value.length > 300) return null;
  if (value.includes("://")) {
    try {
      value = new URL(value).hostname;
    } catch {
      return null;
    }
  }
  value = value.split(/[/?#]/)[0].replace(/\.$/, "");
  const ascii = domainToASCII(value);
  if (!ascii || ascii.length > 253) return null;
  const labels = ascii.split(".");
  if (labels.length < 2) return null;
  if (!labels.every((label) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) return null;
  if (/^[0-9]+$/.test(labels[labels.length - 1])) return null;
  return ascii;
}

export async function loadBootstrap() {
  if (bootstrapCache && bootstrapCache.expires > Date.now()) return bootstrapCache.value;
  const response = await fetch(bootstrapUrl, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!response.ok) throw new Error("bootstrap unavailable");
  const text = await response.text();
  if (text.length > maxJsonBytes * 4) throw new Error("bootstrap too large");
  const value: Bootstrap = JSON.parse(text);
  bootstrapCache = { expires: Date.now() + bootstrapTtlMs, value };
  return value;
}

export function rdapBaseFor(tld: string, bootstrap: Bootstrap) {
  const service = bootstrap.services.find(([tlds]) => tlds.includes(tld));
  const url = service?.[1].find((candidate) => candidate.startsWith("https://") || (rdapTestMode && candidate.startsWith("http://")));
  if (!url) return null;
  return url.endsWith("/") ? url : `${url}/`;
}

const toIso = (value: unknown) => {
  if (typeof value !== "string") return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? value : new Date(time).toISOString();
};

function rdapEvent(json: Record<string, unknown>, action: string) {
  const events = Array.isArray(json.events) ? (json.events as Record<string, unknown>[]) : [];
  return toIso(events.find((event) => event.eventAction === action)?.eventDate);
}

function rdapRegistrar(json: Record<string, unknown>) {
  const entities = Array.isArray(json.entities) ? (json.entities as Record<string, unknown>[]) : [];
  const registrar = entities.find((entity) => Array.isArray(entity.roles) && entity.roles.includes("registrar"));
  const card = (registrar?.vcardArray as unknown[] | undefined)?.[1];
  if (!Array.isArray(card)) return null;
  const name = card.find((property) => Array.isArray(property) && property[0] === "fn") as unknown[] | undefined;
  return typeof name?.[3] === "string" ? name[3] : null;
}

function parseRdap(json: Record<string, unknown>, domain: string): WhoisResult {
  const nameservers = Array.isArray(json.nameservers) ? (json.nameservers as Record<string, unknown>[]) : [];
  const secureDns = json.secureDNS as Record<string, unknown> | undefined;
  return {
    domain: typeof json.ldhName === "string" ? json.ldhName.toLowerCase() : domain,
    source: "rdap",
    registered: true,
    registrar: rdapRegistrar(json),
    created: rdapEvent(json, "registration"),
    updated: rdapEvent(json, "last changed"),
    expires: rdapEvent(json, "expiration"),
    status: Array.isArray(json.status) ? json.status.map(String) : [],
    nameservers: nameservers.flatMap((server) => (typeof server.ldhName === "string" ? [server.ldhName.toLowerCase()] : [])),
    dnssec: typeof secureDns?.delegationSigned === "boolean" ? secureDns.delegationSigned : null,
    raw: JSON.stringify(json, null, 2).slice(0, maxRawChars),
  };
}

async function rdapLookup(domain: string): Promise<Attempt> {
  try {
    const tld = domain.slice(domain.lastIndexOf(".") + 1);
    const base = rdapBaseFor(tld, await loadBootstrap());
    if (!base) return null;
    const response = await fetch(`${base}domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (response.status === 404) return "unregistered";
    if (!response.ok) return null;
    const text = await response.text();
    if (text.length > maxJsonBytes) return null;
    return parseRdap(JSON.parse(text), domain);
  } catch {
    return null;
  }
}

export function queryWhois(host: string, port: number, query: string) {
  return new Promise<string>((resolve, reject) => {
    const socket = connect({ host, port });
    let data = "";
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => socket.write(`${query}\r\n`));
    socket.on("data", (chunk) => {
      data += chunk.toString("utf8");
      if (data.length > maxWhoisBytes) {
        socket.destroy();
        resolve(data.slice(0, maxWhoisBytes));
      }
    });
    socket.on("end", () => resolve(data));
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("timeout"));
    });
    socket.on("error", reject);
  });
}

export function isPublicHostname(host: string) {
  if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])$/i.test(host) || !host.includes(".")) return false;
  if (/^\d+(\.\d+){3}$/.test(host)) return false;
  return !/(^|\.)(localhost|local|internal|lan)$/i.test(host);
}

const notFoundPattern = /no match|not found|no entries found|no data found|status:\s*free|is available|available for registration/i;

function whoisField(text: string, names: string[]) {
  for (const name of names) {
    const match = text.match(new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, "im"));
    if (match) return match[1].trim();
  }
  return null;
}

function whoisList(text: string, names: string[]) {
  const values = names.flatMap((name) => [...text.matchAll(new RegExp(`^\\s*${name}\\s*:\\s*(.+)$`, "gim"))].map((match) => match[1].trim()));
  return [...new Set(values)];
}

function parseWhois(text: string, domain: string): Attempt {
  if (notFoundPattern.test(text)) return "unregistered";
  return {
    domain,
    source: "whois",
    registered: true,
    registrar: whoisField(text, ["Registrar", "Sponsoring Registrar"]),
    created: toIso(whoisField(text, ["Creation Date", "Created", "Registered on", "Registered"])),
    updated: toIso(whoisField(text, ["Updated Date", "Last Updated", "Last modified", "Changed"])),
    expires: toIso(whoisField(text, ["Registry Expiry Date", "Registrar Registration Expiration Date", "Expiry Date", "Expiration Date", "Expires"])),
    status: whoisList(text, ["Domain Status", "Status"]).map((status) => status.split(/\s+/)[0]),
    nameservers: whoisList(text, ["Name Server", "Nserver"]).map((server) => server.split(/\s+/)[0].toLowerCase()),
    dnssec: null,
    raw: text.slice(0, maxRawChars),
  };
}

async function whoisLookup(domain: string): Promise<Attempt> {
  try {
    const [rootHost, rootPort] = rootServer.split(":");
    const tld = domain.slice(domain.lastIndexOf(".") + 1);
    const root = await queryWhois(rootHost, Number(rootPort ?? 43), tld);
    const referral = root.match(/^whois:\s*(\S+)/im)?.[1]?.toLowerCase();
    if (whoisTestMode) return parseWhois(await queryWhois(rootHost, Number(rootPort ?? 43), domain), domain);
    if (!referral || !isPublicHostname(referral)) return null;
    return parseWhois(await queryWhois(referral, 43, domain), domain);
  } catch {
    return null;
  }
}

async function lookupExact(domain: string): Promise<WhoisResult | "unregistered"> {
  const hit = results.get(domain);
  if (hit && hit.expires > Date.now()) return hit.value;
  const attempt = (await rdapLookup(domain)) ?? (await whoisLookup(domain));
  if (!attempt) throw new Error("lookup failed");
  if (attempt !== "unregistered") {
    if (results.size > maxCacheEntries) results.clear();
    results.set(domain, { expires: Date.now() + resultTtlMs, value: attempt });
  }
  return attempt;
}

export async function lookupDomain(domain: string): Promise<WhoisResult> {
  const labels = domain.split(".");
  const candidates = [domain];
  for (let index = 1; index < labels.length - 1 && candidates.length < 3; index++) candidates.push(labels.slice(index).join("."));
  for (const candidate of candidates) {
    const result = await lookupExact(candidate);
    if (result !== "unregistered") return result;
  }
  return {
    domain,
    source: "rdap",
    registered: false,
    registrar: null,
    created: null,
    updated: null,
    expires: null,
    status: [],
    nameservers: [],
    dnssec: null,
    raw: "",
  };
}
