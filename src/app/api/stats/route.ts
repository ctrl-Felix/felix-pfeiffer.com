import { clientIp, tooMany } from "@/lib/rateLimit";
import { getStats } from "@/lib/stats";

export async function GET(request: Request) {
  if (tooMany("stats", clientIp(request), 60, 60_000)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }
  const stats = await getStats();
  if (!stats) return Response.json({ error: "Statistics unavailable." }, { status: 503 });
  return Response.json(stats, { headers: { "Cache-Control": "public, max-age=30" } });
}
