import type { Metadata } from "next";
import Desktop from "@/components/Desktop";
import ToolsHubSeo from "@/components/tools/ToolsHubSeo";
import { toolsHub } from "@/data/tools";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata(toolsHub);

export default function ToolsPage() {
  return (
    <main className="wallpaper relative h-full w-full">
      <ToolsHubSeo />
      <Desktop launch={{ appId: "tools" }} />
    </main>
  );
}
