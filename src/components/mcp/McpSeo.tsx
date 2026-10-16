import JsonLd, { breadcrumbNode, faqNode } from "@/components/JsonLd";
import { site } from "@/config";
import { mcpConnectors, mcpPage, mcpServerUrl } from "@/data/mcp";
import { personRef } from "@/lib/personSchema";

export default function McpSeo() {
  const url = `${site.url}${mcpPage.path}`;
  const nodes = [
    {
      "@type": "TechArticle",
      "@id": `${url}#article`,
      headline: mcpPage.heading,
      description: mcpPage.description,
      url,
      inLanguage: "en",
      dateModified: mcpPage.updated,
      about: { "@type": "Thing", name: "Model Context Protocol" },
      keywords: mcpPage.keywords.join(", "),
      author: personRef,
    },
    {
      "@type": "ItemList",
      name: "Available MCP servers",
      itemListElement: mcpConnectors.map((connector, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${connector.name} MCP server`,
        url: mcpServerUrl(connector),
      })),
    },
    faqNode(mcpPage.faq),
    breadcrumbNode(["MCP servers", url]),
  ];
  return <JsonLd nodes={nodes} />;
}
