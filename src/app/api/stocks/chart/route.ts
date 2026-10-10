import { clientIp, tooMany } from "@/lib/rateLimit";
import { ranges, symbolPattern, type RangeKey } from "@/lib/stocks";
import { getChart } from "@/lib/yahoo";

export async function GET(request: Request) {
  if (tooMany("stocks", clientIp(request), 120, 60_000)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }
  const params = new URL(request.url).searchParams;
  const symbol = params.get("symbol") ?? "";
  const range = params.get("range") ?? "1D";
  if (!symbolPattern.test(symbol) || !(range in ranges)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const data = await getChart(symbol, range as RangeKey);
    return Response.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch {
    return Response.json({ error: "Quote unavailable." }, { status: 502 });
  }
}
