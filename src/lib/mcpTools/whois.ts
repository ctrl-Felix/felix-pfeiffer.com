import { tooMany } from "../rateLimit";
import { lookupDomain, normalizeDomain, type WhoisResult } from "../whois";
import { toolError, type McpTool, type ToolResult } from "./types";

const rawLimit = 8000;
const dayMs = 86_400_000;

export const whoisTool: McpTool = {
  name: "whois_lookup",
  title: "Whois lookup",
  description:
    "Look up public registration data for a domain name via RDAP (falls back to WHOIS on port 43). Returns whether the domain is registered, registrar, created, updated and expiry dates with days remaining, status flags, name servers and DNSSEC. Free, no API key. Registrant contact data is redacted by most registries.",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Domain name or URL to look up, for example example.com. Subdomains are reduced to the registered domain." },
      includeRaw: { type: "boolean", description: "Include the raw registry response (truncated). Default false." },
    },
    required: ["domain"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      domain: { type: "string" },
      registered: { type: "boolean" },
      source: { type: "string", enum: ["rdap", "whois"] },
      registrar: { type: ["string", "null"] },
      created: { type: ["string", "null"], description: "ISO 8601" },
      updated: { type: ["string", "null"], description: "ISO 8601" },
      expires: { type: ["string", "null"], description: "ISO 8601" },
      daysUntilExpiry: { type: ["integer", "null"] },
      expired: { type: ["boolean", "null"] },
      ageDays: { type: ["integer", "null"] },
      status: { type: "array", items: { type: "string" } },
      nameservers: { type: "array", items: { type: "string" } },
      dnssec: { type: ["boolean", "null"] },
      handle: { type: ["string", "null"], description: "Registry domain ID" },
      registrarDetails: {
        type: "object",
        description: "Registrar name, IANA ID, website, WHOIS server and abuse contact",
        properties: {
          name: { type: ["string", "null"] },
          ianaId: { type: ["string", "null"] },
          url: { type: ["string", "null"] },
          whoisServer: { type: ["string", "null"] },
          abuseEmail: { type: ["string", "null"] },
          abusePhone: { type: ["string", "null"] },
        },
      },
      statusDetails: {
        type: "array",
        description: "Status codes with a plain language explanation",
        items: { type: "object", properties: { code: { type: "string" }, label: { type: "string" }, explanation: { type: ["string", "null"] } } },
      },
      nameserverDetails: {
        type: "array",
        description: "Name servers with glue addresses where the registry publishes them",
        items: { type: "object", properties: { host: { type: "string" }, ips: { type: "array", items: { type: "string" } } } },
      },
      dnssecRecords: {
        type: "array",
        description: "DS records published for the domain",
        items: { type: "object", properties: { keyTag: { type: ["integer", "null"] }, algorithm: { type: ["integer", "null"] }, algorithmName: { type: ["string", "null"] }, digestType: { type: ["integer", "null"] }, digestTypeName: { type: ["string", "null"] }, digest: { type: ["string", "null"] } } },
      },
      contacts: {
        type: "array",
        description: "Contacts the registry publishes. Personal data is normally redacted.",
        items: { type: "object", properties: { role: { type: "string" }, name: { type: ["string", "null"] }, organization: { type: ["string", "null"] }, email: { type: ["string", "null"] }, phone: { type: ["string", "null"] }, country: { type: ["string", "null"] }, redacted: { type: "boolean" } } },
      },
      registrantDataRedacted: { type: "boolean" },
      dataServer: { type: ["string", "null"], description: "Server that answered" },
      lookedUpAt: { type: "string" },
      raw: { type: "string" },
    },
    required: ["domain", "registered", "source", "status", "nameservers", "lookedUpAt"],
  },
  annotations: { title: "Whois lookup", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  call: (args, ip) => callWhois(args, ip),
};


function daysFrom(iso: string | null) {
  const time = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(time) ? null : Math.round((time - Date.now()) / dayMs);
}

function enrich(result: WhoisResult, includeRaw: boolean) {
  const daysUntilExpiry = daysFrom(result.expires);
  const createdDays = daysFrom(result.created);
  return {
    domain: result.domain,
    registered: result.registered,
    source: result.source,
    registrar: result.registrar,
    created: result.created,
    updated: result.updated,
    expires: result.expires,
    daysUntilExpiry,
    expired: daysUntilExpiry === null ? null : daysUntilExpiry < 0,
    ageDays: createdDays === null ? null : -createdDays,
    status: result.status,
    nameservers: result.nameservers,
    dnssec: result.dnssec,
    handle: result.handle,
    registrarDetails: result.registrarInfo,
    statusDetails: result.statusInfo.map(({ code, label, explanation }) => ({ code, label, explanation })),
    nameserverDetails: result.nameserverInfo,
    dnssecRecords: result.dsRecords,
    contacts: result.contacts,
    registrantDataRedacted: result.redacted,
    dataServer: result.server,
    lookedUpAt: new Date().toISOString(),
    ...(includeRaw ? { raw: result.raw.slice(0, rawLimit) } : {}),
  };
}

function summarize(data: ReturnType<typeof enrich>) {
  if (!data.registered) return `${data.domain} is not registered (no registration record was found), so it is likely available.`;
  const date = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");
  const expiry =
    data.daysUntilExpiry === null ? "" : data.daysUntilExpiry < 0 ? ` (expired ${-data.daysUntilExpiry} days ago)` : ` (in ${data.daysUntilExpiry} days)`;
  return [
    `${data.domain} is registered.`,
    `Registrar: ${data.registrar ?? "unknown"}${data.registrarDetails.ianaId ? ` (IANA ID ${data.registrarDetails.ianaId})` : ""}`,
    ...(data.registrarDetails.abuseEmail ? [`Registrar abuse contact: ${data.registrarDetails.abuseEmail}`] : []),
    `Created: ${date(data.created)}`,
    `Last updated: ${date(data.updated)}`,
    `Expires: ${date(data.expires)}${expiry}`,
    `Status: ${data.statusDetails.length ? data.statusDetails.map((status) => status.label).join(", ") : "unknown"}`,
    `Name servers: ${data.nameservers.length ? data.nameservers.join(", ") : "unknown"}`,
    `DNSSEC: ${data.dnssec === null ? "unknown" : data.dnssec ? "signed" : "unsigned"}`,
    ...(data.registrantDataRedacted ? ["Registrant data: redacted by the registry"] : []),
    `Source: ${data.source === "rdap" ? "RDAP" : "WHOIS"}`,
    ...(data.raw ? ["", "Raw response:", data.raw] : []),
  ].join("\n");
}

async function callWhois(args: unknown, ip: string): Promise<ToolResult> {
  const input = (args ?? {}) as { domain?: unknown; includeRaw?: unknown };
  if (typeof input.domain !== "string") return toolError("The domain argument is required, for example example.com.");
  const domain = normalizeDomain(input.domain);
  if (!domain) return toolError("That is not a valid domain name. Use a name like example.com.");
  if (tooMany("mcp-whois", ip, 60, 60_000) || tooMany("mcp-whois-global", "all", 300, 60_000)) {
    return toolError("Rate limit reached. Please try again in a minute.");
  }
  try {
    const data = enrich(await lookupDomain(domain), input.includeRaw === true);
    return { content: [{ type: "text" as const, text: summarize(data) }], structuredContent: data };
  } catch {
    return toolError("The lookup failed. The registry may be unreachable. Please try again later.");
  }
}

