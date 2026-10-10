import Link from "next/link";
import { links, site } from "@/config";
import type { ToolInfo } from "@/data/tools";

export default function ToolSeo({ tool }: { tool: ToolInfo }) {
  const url = `${site.url}/tools/${tool.id}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: tool.seo.heading,
        alternateName: `${tool.name} lookup`,
        url,
        description: tool.seo.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        inLanguage: "en",
        isAccessibleForFree: true,
        featureList: tool.seo.features,
        dateModified: tool.updated,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Person", name: site.name, url: site.url, sameAs: [links.github, links.linkedin] },
      },
      {
        "@type": "FAQPage",
        mainEntity: tool.seo.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: site.name, item: site.url },
          { "@type": "ListItem", position: 2, name: "Tools", item: `${site.url}/tools/${tool.id}` },
          { "@type": "ListItem", position: 3, name: tool.name, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <div className="sr-only">
        <h1>{tool.seo.heading}</h1>
        {tool.seo.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <h2>What you get</h2>
        <ul>
          {tool.seo.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
        <h2>How to use it</h2>
        <ol>
          {tool.seo.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <h2>Frequently asked questions</h2>
        {tool.seo.faq.map((item) => (
          <section key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </section>
        ))}
        <p>
          <Link href="/mcp-servers">How to use this tool from an AI assistant (MCP)</Link>
        </p>
        <p>
          Part of the portfolio of <Link href="/">{site.name}</Link>.
        </p>
      </div>
      <noscript>
        <p style={{ position: "fixed", top: 40, left: 16, right: 16, color: "white", textAlign: "center" }}>
          This tool needs JavaScript. {tool.seo.description}
        </p>
      </noscript>
    </>
  );
}
