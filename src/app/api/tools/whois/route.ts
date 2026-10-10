import { clientIp, tooMany } from "@/lib/rateLimit";
import { lookupDomain, normalizeDomain } from "@/lib/whois";

export async function GET(request: Request) {
  if (tooMany("whois", clientIp(request), 12, 60_000)) {
    return Response.json({ error: "Too many lookups. Try again in a minute." }, { status: 429 });
  }
  const domain = normalizeDomain(new URL(request.url).searchParams.get("domain") ?? "");
  if (!domain) return Response.json({ error: "Enter a valid domain name, for example example.com." }, { status: 400 });
  try {
    return Response.json(await lookupDomain(domain), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The lookup failed. Please try again later." }, { status: 502 });
  }
}
