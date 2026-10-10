import type { MetadataRoute } from "next";
import { site } from "@/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/"], disallow: ["/api/", "/mcp/"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
