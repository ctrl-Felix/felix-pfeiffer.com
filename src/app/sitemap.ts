import type { MetadataRoute } from "next";
import { absoluteUrl, publicPaths } from "@/data/publicPaths";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths
    .filter((entry) => entry.indexed)
    .map((entry) => ({
      url: absoluteUrl(entry.path),
      changeFrequency: "monthly",
      priority: entry.path === "/" ? 1 : 0.7,
      ...(entry.updated ? { lastModified: entry.updated } : {}),
    }));
}
