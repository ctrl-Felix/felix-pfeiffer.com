import { after } from "next/server";
import { site } from "@/config";
import { recordClick, recordVisit } from "@/lib/events";
import { clientIp, tooMany } from "@/lib/rateLimit";
import { isTrackTarget } from "@/lib/tracking";
import { classifySource, landingPath } from "@/lib/trafficSources";
import { isBot, visitorId } from "@/lib/visitor";

const noContent = () => new Response(null, { status: 204 });
const ownHost = new URL(site.url).hostname;

export async function POST(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site !== "same-origin") return new Response(null, { status: 403 });
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return noContent();

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return noContent();

  const ip = clientIp(request);
  if (tooMany("track", ip, 120, 60_000)) return new Response(null, { status: 429 });

  const body = await request.json().catch(() => null);
  const isVisit = body?.kind === "visit";
  const isClick = body?.kind === "click" && isTrackTarget(body.target);
  if (!isVisit && !isClick) return new Response(null, { status: 400 });

  try {
    const visitor = await visitorId(ip, userAgent);
    if (isVisit) {
      const source = classifySource(body.referrer, body.campaign, ownHost);
      const landing = landingPath(body.path);
      after(() => recordVisit(visitor, source, landing).catch(() => {}));
    }
    else {
      const target = body.target;
      after(() => recordClick(target, visitor).catch(() => {}));
    }
  } catch {}
  return noContent();
}
