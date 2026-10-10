import type { Metadata } from "next";
import Desktop from "@/components/Desktop";
import ToolsHubSeo from "@/components/tools/ToolsHubSeo";
import { site } from "@/config";
import { toolsHub } from "@/data/tools";

export const metadata: Metadata = {
  title: { absolute: toolsHub.title },
  description: toolsHub.description,
  keywords: toolsHub.keywords,
  alternates: { canonical: toolsHub.path },
  robots: { index: true, follow: true },
  openGraph: { type: "website", url: `${site.url}${toolsHub.path}`, siteName: site.name, title: toolsHub.title, description: toolsHub.description },
  twitter: { card: "summary_large_image", title: toolsHub.title, description: toolsHub.description },
};

export default function ToolsPage() {
  return (
    <main className="wallpaper relative h-full w-full">
      <ToolsHubSeo />
      <Desktop launch={{ appId: "tools" }} />
    </main>
  );
}
