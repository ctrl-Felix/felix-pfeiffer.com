import { normalizeIp } from "@/lib/ipAddress";
import { lookupIp } from "@/lib/ipLookup";
import { clientIp, tooMany } from "@/lib/rateLimit";

export async function GET(request: Request) {
  if (tooMany("ip", clientIp(request), 20, 60_000) || tooMany("ip-global", "all", 200, 60_000)) {
    return Response.json({ error: "Too many lookups. Try again in a minute." }, { status: 429 });
  }
  const address = normalizeIp(new URL(request.url).searchParams.get("ip") ?? "");
  if (!address) return Response.json({ error: "Enter a public IPv4 or IPv6 address, for example 1.1.1.1." }, { status: 400 });
  try {
    return Response.json(await lookupIp(address.ip, address.version), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The lookup failed. Please try again later." }, { status: 502 });
  }
}
