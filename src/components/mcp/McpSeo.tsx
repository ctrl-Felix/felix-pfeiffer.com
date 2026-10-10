import { links, site } from "@/config";
import { mcpConnectors, mcpPage, mcpServerUrl } from "@/data/mcp";

export default function McpSeo() {
  const url = `${site.url}${mcpPage.path}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
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
        author: { "@type": "Person", name: site.name, url: site.url, sameAs: [links.github, links.linkedin] },
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
      {
        "@type": "FAQPage",
        mainEntity: mcpPage.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: site.name, item: site.url },
          { "@type": "ListItem", position: 2, name: "MCP servers", item: url },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
