import { normalizeIp } from "../ipAddress";
import { lookupIp, type IpResult } from "../ipLookup";
import { tooMany } from "../rateLimit";
import { toolError, type McpTool, type ToolResult } from "./types";

const failedLabels: Record<IpResult["failed"][number], string> = { registry: "registry (RDAP)", routing: "routing (ASN)", reverseDns: "reverse DNS" };

function summarize(data: IpResult) {
  const { network, asn } = data;
  const date = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");
  return [
    `IP ${data.ip} (IPv${data.version})`,
    `Reverse DNS: ${data.reverseDns.length ? data.reverseDns.join(", ") : "none"}`,
    ...(asn ? [`ASN: AS${asn.asn}${asn.name ? ` ${asn.name}` : ""}`, `BGP prefix: ${asn.prefix ?? "unknown"}`] : ["ASN: not announced"]),
    ...(network
      ? [
          `Network: ${network.name ?? "unknown"}${network.handle ? ` (${network.handle})` : ""}`,
          `Range: ${network.range ?? "unknown"}${network.cidrs.length ? ` (${network.cidrs.join(", ")})` : ""}`,
          `Type: ${network.type ?? "unknown"}`,
          `Registry: ${network.registry ?? network.server}`,
          `Organization: ${network.organization?.name ?? "unknown"}`,
          ...(network.organization?.address ? [`Address: ${network.organization.address}`] : []),
          `Country: ${network.country ?? network.organization?.country ?? asn?.country ?? "unknown"}`,
          `Registered: ${date(network.registered)}, last changed: ${date(network.updated)}`,
          ...(network.abuse ? [`Abuse contact: ${[network.abuse.email, network.abuse.phone].filter(Boolean).join(", ")}`] : []),
        ]
      : []),
    ...(data.failed.length ? [`Could not be queried: ${data.failed.map((part) => failedLabels[part]).join(", ")}`] : []),
  ].join("\n");
}

async function callIp(args: unknown, clientAddress: string): Promise<ToolResult> {
  const input = (args ?? {}) as { ip?: unknown };
  if (typeof input.ip !== "string") return toolError("The ip argument is required, for example 1.1.1.1.");
  const address = normalizeIp(input.ip);
  if (!address) return toolError("That is not a public IPv4 or IPv6 address. Private, reserved and documentation ranges are not looked up.");
  if (tooMany("mcp-ip", clientAddress, 60, 60_000) || tooMany("mcp-ip-global", "all", 300, 60_000)) {
    return toolError("Rate limit reached. Please try again in a minute.");
  }
  try {
    const result = await lookupIp(address.ip, address.version);
    const data = { ...result, lookedUpAt: new Date().toISOString() };
    return { content: [{ type: "text" as const, text: summarize(result) }], structuredContent: data };
  } catch {
    return toolError("The lookup failed. The registry and resolvers may be unreachable. Please try again later.");
  }
}

const nullableString = { type: ["string", "null"] };

export const ipTool: McpTool = {
  name: "ip_info",
  title: "IP lookup",
  description:
    "Look up a public IPv4 or IPv6 address: the network it belongs to from the regional internet registry via RDAP (name, range, CIDR, type, owner organization with address and country, registration dates, abuse contact), the origin ASN and BGP prefix from Team Cymru, and reverse DNS. Location is the registry country and organization address, not a geolocation. Free, no API key. Private and reserved addresses are rejected.",
  inputSchema: {
    type: "object",
    properties: { ip: { type: "string", description: "Public IPv4 or IPv6 address, for example 1.1.1.1 or 2606:4700:4700::1111." } },
    required: ["ip"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      ip: { type: "string" },
      version: { type: "integer", enum: [4, 6] },
      reverseDns: { type: "array", items: { type: "string" } },
      asn: {
        type: ["object", "null"],
        description: "Origin AS that announces the address, null when it is not announced",
        properties: { asn: { type: "integer" }, name: nullableString, prefix: nullableString, country: nullableString, registry: nullableString, allocated: nullableString },
      },
      network: {
        type: ["object", "null"],
        description: "Registry record of the network",
        properties: {
          handle: nullableString,
          name: nullableString,
          type: nullableString,
          range: nullableString,
          cidrs: { type: "array", items: { type: "string" } },
          country: nullableString,
          parentHandle: nullableString,
          status: { type: "array", items: { type: "string" } },
          registered: { type: ["string", "null"], description: "ISO 8601" },
          updated: { type: ["string", "null"], description: "ISO 8601" },
          organization: { type: ["object", "null"], properties: { name: nullableString, handle: nullableString, address: nullableString, country: nullableString } },
          abuse: { type: ["object", "null"], properties: { email: nullableString, phone: nullableString } },
          remarks: { type: "array", items: { type: "string" } },
          registry: nullableString,
          server: { type: "string" },
        },
      },
      failed: { type: "array", items: { type: "string", enum: ["registry", "routing", "reverseDns"] }, description: "Parts that could not be queried" },
      lookedUpAt: { type: "string" },
    },
    required: ["ip", "version", "reverseDns", "asn", "network", "failed", "lookedUpAt"],
  },
  annotations: { title: "IP lookup", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  call: callIp,
};
