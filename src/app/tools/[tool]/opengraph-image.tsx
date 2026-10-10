import { findToolInfo, toolInfos } from "@/data/tools";
import { ogCard, ogSize } from "@/lib/ogCard";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Free online tool by Felix Pfeiffer";

export function generateStaticParams() {
  return toolInfos.map((tool) => ({ tool: tool.id }));
}

export default async function Image(props: { params: Promise<{ tool: string }> }) {
  const tool = findToolInfo((await props.params).tool);
  return ogCard(tool?.seo.heading ?? "Tools", tool?.description ?? "", `/tools/${tool?.id ?? ""}`);
}
