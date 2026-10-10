import { NextResponse, type NextRequest } from "next/server";
import { findToolInfo } from "@/data/tools";

export function proxy(request: NextRequest) {
  const tool = request.nextUrl.pathname.split("/")[2] ?? "";
  if (findToolInfo(tool)) return NextResponse.next();
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

export const config = { matcher: "/tools/:path*" };
