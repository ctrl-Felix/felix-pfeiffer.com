import type { MetadataRoute } from "next";
import { aboutPage } from "@/data/about";
import { absoluteUrl, publicPaths, type PublicPath } from "@/data/publicPaths";

function priority(entry: PublicPath) {
  if (entry.path === "/") return 1;
  if (entry.path === aboutPage.path) return 0.9;
  if (entry.kind === "tool") return entry.parent ? 0.8 : 0.9;
  return 0.7;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths
    .filter((entry) => entry.indexed)
    .map((entry) => ({
      url: absoluteUrl(entry.path),
      changeFrequency: "monthly",
      priority: priority(entry),
      ...(entry.updated ? { lastModified: entry.updated } : {}),
    }));
}
