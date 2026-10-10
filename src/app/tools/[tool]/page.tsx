import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Desktop from "@/components/Desktop";
import ToolSeo from "@/components/tools/ToolSeo";
import { site } from "@/config";
import { findToolInfo, toolInfos } from "@/data/tools";

export function generateStaticParams() {
  return toolInfos.map((tool) => ({ tool: tool.id }));
}

export async function generateMetadata(props: PageProps<"/tools/[tool]">): Promise<Metadata> {
  const tool = findToolInfo((await props.params).tool);
  if (!tool) return {};
  const path = `/tools/${tool.id}`;
  return {
    title: { absolute: tool.seo.title },
    description: tool.seo.description,
    keywords: tool.keywords,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: { type: "website", url: `${site.url}${path}`, siteName: site.name, title: tool.seo.title, description: tool.seo.description },
    twitter: { card: "summary_large_image", title: tool.seo.title, description: tool.seo.description },
  };
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
