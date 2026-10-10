import { site } from "@/config";
import { handleRpc } from "@/lib/mcp";
import { clientIp, tooMany } from "@/lib/rateLimit";

const maxBodyChars = 16_000;
const allowedOrigins = new Set([site.url, "http://localhost:3000", "http://127.0.0.1:3000"]);
const jsonHeaders = { "Content-Type": "application/json", "Cache-Control": "no-store" };

const rpcError = (status: number, code: number, message: string) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code, message } }), { status, headers: jsonHeaders });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return rpcError(403, -32000, "Origin not allowed");
  const ip = clientIp(request);
  if (tooMany("mcp", ip, 120, 60_000)) return rpcError(429, -32000, "Too many requests");

  const text = await request.text();
  if (text.length > maxBodyChars) return rpcError(413, -32000, "Request too large");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return rpcError(400, -32700, "Parse error");
  }

  const response = await handleRpc(body, ip);
  if (response === null) return new Response(null, { status: 202 });
  return new Response(JSON.stringify(response), { status: 200, headers: jsonHeaders });
}

const methodNotAllowed = () =>
  new Response(JSON.stringify({ error: "This MCP endpoint only accepts POST requests (Streamable HTTP)." }), {
    status: 405,
    headers: { ...jsonHeaders, Allow: "POST" },
  });

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
