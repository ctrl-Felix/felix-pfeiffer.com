import type { Metadata } from "next";
import { site } from "@/config";

type Page = { path: string; title: string; description: string; keywords?: string[] };
type OpenGraph = { type: "website" | "article" } | { type: "profile"; firstName: string; lastName: string };

export function pageMetadata({ path, title, description, keywords }: Page, openGraph: OpenGraph = { type: "website" }): Metadata {
  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { ...openGraph, url: `${site.url}${path}`, siteName: site.name, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
