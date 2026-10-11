import { randomBytes } from "node:crypto";
import { publicResolver } from "./dnsLookup";

export type ProbeResolver = { resolve4: (name: string) => Promise<string[]> };
export type ProbeResult = { found: string[]; checked: number; wildcardDns: boolean };

export const commonLabels = [
  "www", "mail", "webmail", "email", "smtp", "imap", "pop", "pop3", "mx", "mx1", "mx2", "autodiscover", "autoconfig", "owa", "exchange",
  "ns", "ns1", "ns2", "ns3", "dns", "vpn", "remote", "gateway", "proxy", "ftp", "sftp", "files", "backup", "cpanel", "webdisk", "whm",
  "api", "app", "apps", "admin", "portal", "dashboard", "panel", "console", "manage", "auth", "login", "sso", "id", "account", "accounts", "my",
  "dev", "development", "staging", "stage", "test", "testing", "beta", "demo", "sandbox", "qa", "uat", "preview", "old", "new", "legacy",
  "blog", "news", "shop", "store", "pay", "checkout", "cdn", "static", "assets", "media", "img", "images", "video", "download", "downloads",
  "docs", "help", "support", "status", "community", "forum", "careers", "jobs", "events", "m", "mobile", "web", "home", "intranet", "extranet",
  "git", "gitlab", "jira", "confluence", "wiki", "ci", "jenkins", "grafana", "monitor", "metrics", "analytics", "crm", "calendar", "chat", "meet",
  "cloud", "server", "db", "search", "go", "link", "links", "newsletter", "info", "secure", "partner", "partners",
];

const concurrency = 8;
const nameMissingCodes = new Set(["ENOTFOUND"]);
const nameExistsCodes = new Set(["ENODATA"]);

type Answer = { exists: true; addresses: string } | { exists: false } | null;

async function ask(name: string, resolver: ProbeResolver): Promise<Answer> {
  try {
    return { exists: true, addresses: [...(await resolver.resolve4(name))].sort().join(",") };
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    if (typeof code === "string" && nameExistsCodes.has(code)) return { exists: true, addresses: "" };
    if (typeof code === "string" && nameMissingCodes.has(code)) return { exists: false };
    return null;
  }
}

export async function probeCommonSubdomains(domain: string, resolver: ProbeResolver = publicResolver(), labels: readonly string[] = commonLabels): Promise<ProbeResult> {
  const wildcard = await ask(`${randomBytes(8).toString("hex")}.${domain}`, resolver);
  if (wildcard === null) throw new Error("resolver unavailable");
  const wildcardAddresses = wildcard.exists ? wildcard.addresses : null;

  const found: string[] = [];
  let answered = 0;
  const queue = [...labels];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let label = queue.shift(); label !== undefined; label = queue.shift()) {
        const name = `${label}.${domain}`;
        const answer = await ask(name, resolver);
        if (answer === null) continue;
        answered += 1;
        if (answer.exists && answer.addresses !== wildcardAddresses) found.push(name);
      }
    }),
  );
  if (!answered && labels.length) throw new Error("resolver unavailable");
  return { found, checked: labels.length, wildcardDns: wildcardAddresses !== null };
}
