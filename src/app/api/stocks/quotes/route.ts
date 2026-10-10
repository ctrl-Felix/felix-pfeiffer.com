import { clientIp, tooMany } from "@/lib/rateLimit";
import { symbolPattern } from "@/lib/stocks";
import { getQuotes } from "@/lib/market";

const maxSymbols = 25;

export async function GET(request: Request) {
  if (tooMany("stocks", clientIp(request), 120, 60_000)) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }
  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").filter(Boolean))];
  if (!symbols.length || symbols.length > maxSymbols || !symbols.every((symbol) => symbolPattern.test(symbol))) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  return Response.json(await getQuotes(symbols), { headers: { "Cache-Control": "public, max-age=30" } });
}
