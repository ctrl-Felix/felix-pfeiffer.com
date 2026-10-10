import { tooMany } from "../rateLimit";
import { lookupDns, normalizeDnsName, recordTypes, type DnsRecords, type DnsResult, type RecordType } from "../dnsLookup";
import { toolError, type McpTool, type ToolResult } from "./types";

const typeList = recordTypes.join(", ");

function summarize(result: DnsResult) {
  if (!result.exists) return `${result.domain} does not exist (the DNS answered with NXDOMAIN).`;
  const lines = [`DNS records for ${result.domain}`];
  const records = result.records as DnsRecords;
  const add = (label: string, values: string[] | undefined) => {
    if (values !== undefined) lines.push(`${label}: ${values.length ? values.join(" | ") : "none"}`);
  };
  add("A", records.A?.map((record) => `${record.address} (TTL ${record.ttl}s)`));
  add("AAAA", records.AAAA?.map((record) => `${record.address} (TTL ${record.ttl}s)`));
  add("CNAME", records.CNAME);
  add("MX", records.MX?.map((record) => `${record.priority} ${record.exchange}`));
  add("NS", records.NS);
  add("TXT", records.TXT?.map((value) => (value.length > 200 ? `${value.slice(0, 200)}…` : value)));
  if (records.SOA !== undefined) lines.push(`SOA: ${records.SOA ? `${records.SOA.primaryNameserver} ${records.SOA.hostmaster} serial ${records.SOA.serial}` : "none"}`);
  add("CAA", records.CAA?.map((record) => `${record.critical ? "critical " : ""}${record.tag} ${record.value}`));
  const failed = Object.entries(result.failures).map(([type, code]) => `${type} (${code})`);
  if (failed.length) lines.push(`Could not be queried: ${failed.join(", ")}`);
  return lines.join("\n");
}

async function callDns(args: unknown, ip: string): Promise<ToolResult> {
  const input = (args ?? {}) as { domain?: unknown; types?: unknown };
  if (typeof input.domain !== "string") return toolError("The domain argument is required, for example example.com.");
  const domain = normalizeDnsName(input.domain);
  if (!domain) return toolError("That is not a valid public domain name. Use a name like example.com or _dmarc.example.com.");

  let types: RecordType[] = [...recordTypes];
  if (input.types !== undefined) {
    const requested = Array.isArray(input.types) ? input.types.map((type) => String(type).toUpperCase()) : [];
    if (!requested.length || !requested.every((type): type is RecordType => (recordTypes as readonly string[]).includes(type))) {
      return toolError(`The types argument must be a non-empty list of: ${typeList}.`);
    }
    types = [...new Set(requested)];
  }

  if (tooMany("mcp-dns", ip, 60, 60_000) || tooMany("mcp-dns-global", "all", 300, 60_000)) {
    return toolError("Rate limit reached. Please try again in a minute.");
  }
  try {
    const result = await lookupDns(domain, types);
    const data = { ...result, lookedUpAt: new Date().toISOString() };
    return { content: [{ type: "text" as const, text: summarize(result) }], structuredContent: data };
  } catch {
    return toolError("The DNS lookup failed. The resolvers may be unreachable. Please try again later.");
  }
}

const caaItem = { type: "object", properties: { critical: { type: "boolean" }, tag: { type: "string" }, value: { type: "string" } } };
const addressItem = { type: "object", properties: { address: { type: "string" }, ttl: { type: "integer" } } };

export const dnsTool: McpTool = {
  name: "dns_records",
  title: "DNS records",
  description: `Look up the public DNS records of a domain name through public resolvers. Returns ${typeList} records (all by default, or the list given in types). Subdomains and underscore names such as _dmarc.example.com work. A and AAAA records include their TTL. Free, no API key. Private and internal names are rejected.`,
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Domain name to look up, for example example.com or _dmarc.example.com." },
      types: { type: "array", items: { type: "string", enum: [...recordTypes] }, description: `Record types to query. Default: all of ${typeList}.` },
    },
    required: ["domain"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: {
      domain: { type: "string" },
      exists: { type: "boolean", description: "False when the name does not exist (NXDOMAIN)." },
      records: {
        type: "object",
        properties: {
          A: { type: "array", items: addressItem },
          AAAA: { type: "array", items: addressItem },
          CNAME: { type: "array", items: { type: "string" } },
          MX: { type: "array", items: { type: "object", properties: { priority: { type: "integer" }, exchange: { type: "string" } } } },
          NS: { type: "array", items: { type: "string" } },
          TXT: { type: "array", items: { type: "string" } },
          SOA: { type: ["object", "null"] },
          CAA: { type: "array", items: caaItem },
        },
      },
      failures: { type: "object", description: "Record types that could not be queried, with the resolver error code." },
      lookedUpAt: { type: "string" },
    },
    required: ["domain", "exists", "records", "failures", "lookedUpAt"],
  },
  annotations: { title: "DNS records", readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  call: callDns,
};
