import { clientIp, tooMany } from "@/lib/rateLimit";
import { searchSymbols } from "@/lib/yahoo";

export async function GET(request: Request) {
  if (tooMany("stocks", clientIp(request), 120, 60_000)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!query || query.length > 40) return Response.json([]);
  try {
    return Response.json(await searchSymbols(query), { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return Response.json({ error: "Search unavailable." }, { status: 502 });
  }
}
