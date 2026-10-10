import { NextResponse, type NextRequest } from "next/server";
import { findToolInfo } from "@/data/tools";

const wantsEventStream = (request: NextRequest) => {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/event-stream") && !accept.includes("text/html");
};

function routeMcp(request: NextRequest) {
  const pageRequest = request.method === "GET" || request.method === "HEAD";
  if (pageRequest && !wantsEventStream(request)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/api/mcp";
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/mcp") return routeMcp(request);
  const tool = request.nextUrl.pathname.split("/")[2] ?? "";
  if (findToolInfo(tool)) return NextResponse.next();
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

export const config = { matcher: ["/tools/:path*", "/mcp"] };
