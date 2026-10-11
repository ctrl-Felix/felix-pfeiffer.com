import { tooMany } from "../rateLimit";
import { findSubdomains, normalizeSubdomainQuery, TooManyCertificatesError, type SubdomainResult } from "../subdomains";
import { toolError, type McpTool, type ToolResult } from "./types";

const defaultLimit = 300;
const maxLimit = 2000;

function select(result: SubdomainResult, currentOnly: boolean, limit: number) {
  const matching = currentOnly ? result.subdomains.filter((item) => item.current) : result.subdomains;
  return {
    domain: result.domain,
    scope: result.scope,
    certificates: result.certificates,
    totalNames: matching.length,
    returnedNames: Math.min(limit, matching.length),
    subdomains: matching.slice(0, limit),
    issuers: result.issuers.slice(0, 10),
    truncated: result.truncated || matching.length > limit,
    source: "crt.sh",
    lookedUpAt: new Date().toISOString(),
  };
}

function summarize(data: ReturnType<typeof select>) {
  if (!data.totalNames) return `No names under ${data.domain} were found in the certificate transparency logs.`;
  const date = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");
  return [
    `${data.totalNames} names under ${data.domain} found in ${data.certificates} certificates (certificate transparency logs via crt.sh${data.scope === "unexpired" ? ", unexpired certificates only because the domain has too many" : ""}).`,
    `Issuers: ${data.issuers.map((issuer) => `${issuer.name} (${issuer.certificates})`).join(", ")}`,
    "",
    ...data.subdomains.map((item) => `${item.name}${item.wildcard ? " [wildcard]" : ""} ${item.current ? "current" : "expired"}, first seen ${date(item.firstSeen)}, last expiry ${date(item.lastExpires)}`),
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
  if (tooMany("mcp-subdomains", ip, 20, 60_000) || tooMany("mcp-subdomains-global", "all", 60, 60_000)) {
    return toolError("Rate limit reached. Please try again in a minute.");
  }
  try {
    const data = select(await findSubdomains(domain), input.currentOnly === true, (input.limit as number | undefined) ?? defaultLimit);
    return { content: [{ type: "text" as const, text: summarize(data) }], structuredContent: data };
  } catch (error) {
    if (error instanceof TooManyCertificatesError) return toolError("This domain has too many certificates to list. Search a more specific name, for example shop.example.com.");
    return toolError("The certificate transparency search failed. crt.sh may be busy. Please try again later.");
  }
}

export const subdomainsTool: McpTool = {
  name: "subdomain_discovery",
  title: "Subdomain discovery",
  description: `Find the subdomains of a domain from public certificate transparency logs (crt.sh). Every publicly trusted TLS certificate is logged, so the names it covers become public. Returns each name with wildcard flag, number of certificates, first seen date, last expiry and whether a certificate is still valid, plus the issuing certificate authorities. Passive: the domain itself is not contacted. Free, no API key. Up to ${maxLimit} names per call.`,
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Domain to search below, for example example.com. A URL or *.example.com also works." },
      currentOnly: { type: "boolean", description: "Only names with a certificate that is valid today. Default false." },
      limit: { type: "integer", minimum: 1, maximum: maxLimit, description: `Maximum number of names to return. Default ${defaultLimit}.` },
    },
    required: ["domain"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      domain: { type: "string" },
      scope: { type: "string", enum: ["all", "unexpired"], description: "unexpired when the domain had too many certificates and only valid ones were searched" },
      certificates: { type: "integer", description: "Unique certificates that name the domain or a subdomain" },
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
          },
        },
      },
      issuers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, certificates: { type: "integer" } } } },
      truncated: { type: "boolean" },
      source: { type: "string" },
      lookedUpAt: { type: "string" },
    },
    required: ["domain", "scope", "certificates", "totalNames", "returnedNames", "subdomains", "issuers", "truncated", "source", "lookedUpAt"],
  },
  annotations: { title: "Subdomain discovery", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  call: callSubdomains,
};
