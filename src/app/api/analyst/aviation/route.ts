import { aviationDashboard } from "@/lib/aviationDashboard";
import { clientIp, overMinuteLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  if (overMinuteLimit("analyst", clientIp(request), 20, 300)) {
    return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }
  try {
    return Response.json(await aviationDashboard(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The data could not be loaded. Please try again later." }, { status: 502 });
  }
}
