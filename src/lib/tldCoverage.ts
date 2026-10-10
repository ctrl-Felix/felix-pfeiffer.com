import { isPublicHostname, loadBootstrap, queryWhois, rdapBaseFor } from "./whois";

export type TldRoute = "rdap" | "whois" | "none" | "error";
export type Coverage = Record<string, boolean>;

const rootServer = process.env.WHOIS_ROOT_SERVER ?? "whois.iana.org:43";
const tldPattern = /^[a-z0-9-]{2,63}$/;
const attempts = 2;
const retryDelayMs = 250;
const concurrency = 6;

export function parseTldList(text: string) {
  const tlds = text
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line && !line.startsWith("#") && tldPattern.test(line));
  return [...new Set(tlds)].sort();
}

async function whoisReferral(tld: string) {
  const [host, port] = rootServer.split(":");
  const answer = await queryWhois(host, Number(port ?? 43), tld);
  if (!answer.trim()) throw new Error("empty answer");
  const referral = answer.match(/^whois:\s*(\S+)/im)?.[1]?.toLowerCase();
  return referral && isPublicHostname(referral) ? referral : null;
}

export async function tldRoute(tld: string): Promise<TldRoute> {
  try {
    if (rdapBaseFor(tld, await loadBootstrap())) return "rdap";
  } catch {
    return "error";
  }
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return (await whoisReferral(tld)) ? "whois" : "none";
    } catch {
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
  return "error";
}

export async function buildCoverage(tlds: string[], previous: Coverage = {}, route: (tld: string) => Promise<TldRoute> = tldRoute) {
  const coverage: Coverage = {};
  const unknown: string[] = [];
  let next = 0;

  const worker = async () => {
    while (next < tlds.length) {
      const tld = tlds[next++];
      const found = await route(tld);
      if (found === "error") {
        unknown.push(tld);
        coverage[tld] = previous[tld] ?? false;
      } else coverage[tld] = found !== "none";
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tlds.length) }, worker));

  const sorted = Object.fromEntries(Object.entries(coverage).sort(([a], [b]) => (a < b ? -1 : 1)));
  return { coverage: sorted, unknown: unknown.sort() };
}
