import { connect } from "node:net";
import { domainToASCII } from "node:url";
import { parseRdap } from "./rdapParser";
import { hasUsefulData, notFoundPattern, parseWhoisText } from "./whoisTextParser";
import { emptyResult, type WhoisResult } from "./whoisTypes";

export type { WhoisResult } from "./whoisTypes";

type Bootstrap = { services: [string[], string[]][] };
type Attempt = WhoisResult | "unregistered" | null;

const bootstrapUrl = process.env.RDAP_BOOTSTRAP_URL ?? "https://data.iana.org/rdap/dns.json";
const rootServer = process.env.WHOIS_ROOT_SERVER ?? "whois.iana.org:43";
const rdapTestMode = Boolean(process.env.RDAP_BOOTSTRAP_URL);
const whoisTestMode = Boolean(process.env.WHOIS_ROOT_SERVER);

const timeoutMs = 8000;
const maxJsonBytes = 512 * 1024;
const maxWhoisBytes = 64 * 1024;
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
    return parseRdap(JSON.parse(text), domain, new URL(base).hostname);
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

function readWhois(text: string, domain: string, server: string): Attempt {
  if (notFoundPattern.test(text)) return "unregistered";
  const result = parseWhoisText(text, domain, server);
  return hasUsefulData(result) ? result : null;
}

async function whoisLookup(domain: string): Promise<Attempt> {
  try {
    const [rootHost, rootPort] = rootServer.split(":");
    const tld = domain.slice(domain.lastIndexOf(".") + 1);
    const root = await queryWhois(rootHost, Number(rootPort ?? 43), tld);
    const referral = root.match(/^whois:\s*(\S+)/im)?.[1]?.toLowerCase();
    if (whoisTestMode) return readWhois(await queryWhois(rootHost, Number(rootPort ?? 43), domain), domain, rootHost);
    if (!referral || !isPublicHostname(referral)) return null;
    return readWhois(await queryWhois(referral, 43, domain), domain, referral);
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
  return emptyResult(domain, "rdap", false);
}
