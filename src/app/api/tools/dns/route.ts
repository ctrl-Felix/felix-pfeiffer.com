import { lookupDns, normalizeDnsName, recordTypes, type RecordType } from "@/lib/dnsLookup";
import { clientIp, tooMany } from "@/lib/rateLimit";

export async function GET(request: Request) {
  if (tooMany("dns", clientIp(request), 20, 60_000)) {
    return Response.json({ error: "Too many lookups. Try again in a minute." }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const domain = normalizeDnsName(params.get("domain") ?? "");
  if (!domain) return Response.json({ error: "Enter a valid public domain name, for example example.com." }, { status: 400 });

  const requested = params.get("types");
  let types: RecordType[] = [...recordTypes];
  if (requested) {
    const list = requested.toUpperCase().split(",");
    if (!list.every((type): type is RecordType => (recordTypes as readonly string[]).includes(type))) {
      return Response.json({ error: "Unknown record type." }, { status: 400 });
    }
    types = [...new Set(list)];
  }
  try {
    return Response.json(await lookupDns(domain, types), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The lookup failed. Please try again later." }, { status: 502 });
  }
}
