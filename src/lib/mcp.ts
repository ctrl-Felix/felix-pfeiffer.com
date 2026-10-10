import { mcpTools } from "./mcpTools";
import { toolSummary } from "./mcpTools/types";

type Id = string | number | null;
type RpcResponse = { jsonrpc: "2.0"; id: Id; result?: unknown; error?: { code: number; message: string } };

const protocolVersions = ["2025-06-18", "2025-03-26", "2024-11-05"];
const maxBatch = 10;

const instructions =
  "Security research tools for public data. Use whois_lookup for the registration data of a domain (registrar, dates, status flags, name servers, DNSSEC) and dns_records for its DNS records (A, AAAA, CNAME, MX, NS, TXT, SOA, CAA). Registrant personal data is normally redacted by registries and is not available. All tools are read only, need no account and answers are cached for a short time.";

const ok = (id: Id, result: unknown): RpcResponse => ({ jsonrpc: "2.0", id, result });
const fail = (id: Id, code: number, message: string): RpcResponse => ({ jsonrpc: "2.0", id, error: { code, message } });

async function handleOne(message: unknown, ip: string): Promise<RpcResponse | null> {
  const request = message as { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown } | null;
  if (!request || typeof request !== "object" || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return fail(null, -32600, "Invalid request");
  }
  const hasId = typeof request.id === "string" || typeof request.id === "number";
  if (!hasId) return null;
  const id = request.id as Id;
  const params = (request.params ?? {}) as Record<string, unknown>;

  switch (request.method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return ok(id, {
        protocolVersion: protocolVersions.includes(requested) ? requested : protocolVersions[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "felix-pfeiffer-security", title: "Security research tools by Felix Pfeiffer", version: "2.0.0" },
        instructions,
      });
    }
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: mcpTools.map(toolSummary) });
    case "tools/call": {
      const tool = mcpTools.find((candidate) => candidate.name === params.name);
      if (!tool) return fail(id, -32602, `Unknown tool: ${String(params.name)}`);
      return ok(id, await tool.call(params.arguments, ip));
    }
    default:
      return fail(id, -32601, "Method not found");
  }
}

export async function handleRpc(body: unknown, ip: string): Promise<RpcResponse | RpcResponse[] | null> {
  if (Array.isArray(body)) {
    if (!body.length || body.length > maxBatch) return fail(null, -32600, "Invalid batch size");
    const responses = (await Promise.all(body.map((message) => handleOne(message, ip)))).filter((response): response is RpcResponse => response !== null);
    return responses.length ? responses : null;
  }
  return handleOne(body, ip);
}
