import { energyReport, parseEnergyQuery } from "@/lib/energy";
import { clientIp, tooMany } from "@/lib/rateLimit";

export async function GET(request: Request) {
  if (tooMany("energy", clientIp(request), 20, 60_000)) {
    return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  const query = parseEnergyQuery(new URL(request.url).searchParams);
  if (!query) return Response.json({ error: "Invalid location." }, { status: 400 });
  try {
    const report = await energyReport(query);
    if (!report) return Response.json({ error: "No data for your location." }, { status: 404 });
    return Response.json(report, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The estimate failed. Please try again later." }, { status: 502 });
  }
}
