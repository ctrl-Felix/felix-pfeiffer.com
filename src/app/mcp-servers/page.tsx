import type { Metadata } from "next";
import McpPage from "@/components/mcp/McpPage";
import McpSeo from "@/components/mcp/McpSeo";
import { site } from "@/config";
import { mcpPage } from "@/data/mcp";

export const metadata: Metadata = {
  title: { absolute: mcpPage.title },
  description: mcpPage.description,
  keywords: mcpPage.keywords,
  alternates: { canonical: mcpPage.path },
  robots: { index: true, follow: true },
  openGraph: { type: "article", url: `${site.url}${mcpPage.path}`, siteName: site.name, title: mcpPage.title, description: mcpPage.description },
  twitter: { card: "summary_large_image", title: mcpPage.title, description: mcpPage.description },
};

export default function McpServersPage() {
  return (
    <>
      <McpSeo />
      <McpPage />
    </>
  );
}
