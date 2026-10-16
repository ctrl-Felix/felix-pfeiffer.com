import type { Metadata } from "next";
import McpPage from "@/components/mcp/McpPage";
import McpSeo from "@/components/mcp/McpSeo";
import VisitTracker from "@/components/VisitTracker";
import { mcpPage } from "@/data/mcp";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata(mcpPage, { type: "article" });

export default function McpIndexPage() {
  return (
    <>
      <McpSeo />
      <McpPage />
      <VisitTracker />
    </>
  );
}
