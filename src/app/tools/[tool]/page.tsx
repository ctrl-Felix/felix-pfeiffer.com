import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Desktop from "@/components/Desktop";
import ToolSeo from "@/components/tools/ToolSeo";
import { findToolInfo, toolInfos } from "@/data/tools";
import { pageMetadata } from "@/lib/pageMetadata";

export function generateStaticParams() {
  return toolInfos.map((tool) => ({ tool: tool.id }));
}

export async function generateMetadata(props: PageProps<"/tools/[tool]">): Promise<Metadata> {
  const tool = findToolInfo((await props.params).tool);
  if (!tool) return {};
  return pageMetadata({ path: `/tools/${tool.id}`, title: tool.seo.title, description: tool.seo.description, keywords: tool.keywords });
}

export default async function ToolPage(props: PageProps<"/tools/[tool]">) {
  const tool = findToolInfo((await props.params).tool);
  if (!tool) notFound();
  return (
    <main className="wallpaper relative h-full w-full">
      <ToolSeo tool={tool} />
      <Desktop launch={{ appId: "tools", toolId: tool.id }} />
    </main>
  );
}
