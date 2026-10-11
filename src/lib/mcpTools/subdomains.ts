import { tooMany } from "../rateLimit";
import { findSubdomains, normalizeSubdomainQuery, TooManyCertificatesError, type Subdomain, type SubdomainResult } from "../subdomains";
import { commonLabels } from "../subdomainProbe";
import { toolError, type McpTool, type ToolResult } from "./types";

const defaultLimit = 300;
const maxLimit = 2000;

const certificateNotes: Record<SubdomainResult["certificateSearch"], string> = {
  complete: "",
  incomplete: " The domain has more certificates than one search covers, so the certificate list is incomplete.",
  unexpired: " The domain has too many certificates, so only unexpired ones were searched.",
  "too-many": " The domain has too many certificates to search, so only the DNS check is included.",
  failed: " The certificate logs did not answer, so only the DNS check is included.",
};

function select(result: SubdomainResult, currentOnly: boolean, limit: number) {
  const matching = currentOnly ? result.subdomains.filter((item) => item.current || item.foundInDns) : result.subdomains;
  return {
    domain: result.domain,
    certificateSearch: result.certificateSearch,
    certificates: result.certificates,
    dnsCheck: result.dnsCheck,
    totalNames: matching.length,
    returnedNames: Math.min(limit, matching.length),
    subdomains: matching.slice(0, limit),
    issuers: result.issuers.slice(0, 10),
    truncated: result.truncated || matching.length > limit,
    source: result.certificateSource ? `crt.sh ${result.certificateSource}` : null,
    lookedUpAt: new Date().toISOString(),
  };
}

function describe(item: Subdomain) {
  const date = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");
  const parts = [
    ...(item.certificates ? [`${item.current ? "valid certificate" : "expired"}, first seen ${date(item.firstSeen)}, last expiry ${date(item.lastExpires)}`] : []),
    ...(item.foundInDns ? ["resolves in DNS"] : []),
  ];
  return `${item.name}${item.wildcard ? " [wildcard]" : ""}: ${parts.join(", ")}`;
}

function summarize(data: ReturnType<typeof select>) {
  const dns = data.dnsCheck
    ? ` ${data.dnsCheck.found} of ${data.dnsCheck.checked} common names resolve in DNS${data.dnsCheck.wildcardDns ? " (the domain answers every name, so only names with their own addresses count)" : ""}.`
    : " The DNS check of common names failed.";
  const lead = `${data.totalNames} names under ${data.domain}: ${data.certificates} certificates in the certificate transparency logs.${dns}${certificateNotes[data.certificateSearch]}`;
  if (!data.totalNames) return lead;
  return [
    lead,
    ...(data.issuers.length ? [`Issuers: ${data.issuers.map((issuer) => `${issuer.name} (${issuer.certificates})`).join(", ")}`] : []),
    "",
    ...data.subdomains.map(describe),
    ...(data.truncated ? ["", `Showing ${data.returnedNames} names. Raise limit (up to ${maxLimit}) or search a more specific name for more.`] : []),
  ].join("\n");
}

async function callSubdomains(args: unknown, ip: string): Promise<ToolResult> {
  const input = (args ?? {}) as { domain?: unknown; currentOnly?: unknown; limit?: unknown };
  if (typeof input.domain !== "string") return toolError("The domain argument is required, for example example.com.");
  const domain = normalizeSubdomainQuery(input.domain);
  if (!domain) return toolError("That is not a valid public domain name. Use a name like example.com.");
  if (input.currentOnly !== undefined && typeof input.currentOnly !== "boolean") return toolError("The currentOnly argument must be true or false.");
  if (input.limit !== undefined && (!Number.isInteger(input.limit) || (input.limit as number) < 1 || (input.limit as number) > maxLimit)) {
    return toolError(`The limit argument must be a whole number from 1 to ${maxLimit}.`);
  }
  if (tooMany("mcp-subdomains", ip, 20, 60_000) || tooMany("mcp-subdomains-global", "all", 30, 60_000)) {
    return toolError("Rate limit reached. Please try again in a minute.");
  }
  try {
    const data = select(await findSubdomains(domain), input.currentOnly === true, (input.limit as number | undefined) ?? defaultLimit);
    return { content: [{ type: "text" as const, text: summarize(data) }], structuredContent: data };
  } catch (error) {
    if (error instanceof TooManyCertificatesError) return toolError("This domain has too many certificates to list. Search a more specific name, for example shop.example.com.");
    return toolError("The certificate logs and DNS resolvers did not answer. Please try again later.");
  }
}

export const subdomainsTool: McpTool = {
  name: "subdomain_discovery",
  title: "Subdomain discovery",
  description: `Find the subdomains of a domain. Searches the public certificate transparency logs (crt.sh), where every publicly trusted TLS certificate is listed, and checks ${commonLabels.length} common names such as www, mail and api through public DNS resolvers. Returns each name with wildcard flag, number of certificates, first seen date, last expiry, whether a certificate is still valid and whether it was found in DNS, plus the issuing certificate authorities. Passive: apart from normal DNS lookups nothing contacts the servers of the domain. Free, no API key. Up to ${maxLimit} names per call.`,
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Domain to search below, for example example.com. A URL or *.example.com also works." },
      currentOnly: { type: "boolean", description: "Only names with a certificate that is valid today or found in DNS. Default false." },
      limit: { type: "integer", minimum: 1, maximum: maxLimit, description: `Maximum number of names to return. Default ${defaultLimit}.` },
    },
    required: ["domain"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      domain: { type: "string" },
      certificateSearch: {
        type: "string",
        enum: ["complete", "incomplete", "unexpired", "too-many", "failed"],
        description: "complete, incomplete (row limit reached), unexpired (only valid certificates searched), too-many or failed (only the DNS check is included)",
      },
      certificates: { type: "integer", description: "Unique certificates that name the domain or a subdomain" },
      dnsCheck: {
        type: ["object", "null"],
        description: "Common names checked through public DNS resolvers, null when the check failed",
        properties: { checked: { type: "integer" }, found: { type: "integer" }, wildcardDns: { type: "boolean", description: "The domain answers every name" } },
      },
      totalNames: { type: "integer" },
      returnedNames: { type: "integer" },
      subdomains: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            wildcard: { type: "boolean", description: "A wildcard certificate covers *.name" },
            certificates: { type: "integer" },
            firstSeen: { type: ["string", "null"], description: "ISO 8601, earliest certificate start" },
            lastExpires: { type: ["string", "null"], description: "ISO 8601, latest certificate expiry" },
            current: { type: "boolean", description: "A certificate for this name is valid today" },
            foundInDns: { type: "boolean", description: "Found by the DNS check of common names" },
          },
        },
      },
      issuers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, certificates: { type: "integer" } } } },
      truncated: { type: "boolean" },
      source: { type: ["string", "null"], description: "Where the certificates came from" },
      lookedUpAt: { type: "string" },
    },
    required: ["domain", "certificateSearch", "certificates", "dnsCheck", "totalNames", "returnedNames", "subdomains", "issuers", "truncated", "source", "lookedUpAt"],
  },
  annotations: { title: "Subdomain discovery", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  call: callSubdomains,
};
