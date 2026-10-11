import { clientIp, tooMany } from "@/lib/rateLimit";
import { findSubdomains, normalizeSubdomainQuery, TooManyCertificatesError } from "@/lib/subdomains";

export async function GET(request: Request) {
  if (tooMany("subdomains", clientIp(request), 10, 60_000) || tooMany("subdomains-global", "all", 30, 60_000)) {
    return Response.json({ error: "Too many searches. Try again in a minute." }, { status: 429 });
  }
  const domain = normalizeSubdomainQuery(new URL(request.url).searchParams.get("domain") ?? "");
  if (!domain) return Response.json({ error: "Enter a valid public domain name, for example example.com." }, { status: 400 });
  try {
    return Response.json(await findSubdomains(domain), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof TooManyCertificatesError) {
      return Response.json({ error: "This domain has too many certificates to list. Try a more specific name, for example shop.example.com." }, { status: 422 });
    }
    return Response.json({ error: "The certificate logs and DNS resolvers did not answer. Please try again later." }, { status: 502 });
  }
}
