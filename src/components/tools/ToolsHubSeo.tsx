import Link from "next/link";
import { site } from "@/config";
import { toolInfos, toolsHub } from "@/data/tools";
import { personRef } from "@/lib/personSchema";

export default function ToolsHubSeo() {
  const url = `${site.url}${toolsHub.path}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: toolsHub.heading,
        description: toolsHub.description,
        url,
        inLanguage: "en",
        dateModified: toolsHub.updated,
        isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
        author: personRef,
      },
      {
        "@type": "ItemList",
        name: toolsHub.heading,
        itemListElement: toolInfos.map((tool, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tool.seo.heading,
          url: `${site.url}/tools/${tool.id}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: site.name, item: site.url },
          { "@type": "ListItem", position: 2, name: "Tools", item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <div className="sr-only">
        <h1>{toolsHub.heading}</h1>
        <p>{toolsHub.intro}</p>
        <ul>
          {toolInfos.map((tool) => (
            <li key={tool.id}>
              <h2>
                <Link href={`/tools/${tool.id}`}>{tool.seo.heading}</Link>
              </h2>
              <p>{tool.description}</p>
              <ul>
                {tool.seo.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/mcp">Use these tools from an AI assistant (MCP)</Link>
        </p>
        <p>
          Part of the portfolio of <Link href="/">{site.name}</Link>.
        </p>
      </div>
      <noscript>
        <p style={{ position: "fixed", top: 40, left: 16, right: 16, color: "white", textAlign: "center" }}>
          These tools need JavaScript. {toolsHub.description}
        </p>
      </noscript>
    </>
  );
}
