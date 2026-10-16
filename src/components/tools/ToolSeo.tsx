import Link from "next/link";
import JsonLd, { breadcrumbNode, faqNode } from "@/components/JsonLd";
import { site } from "@/config";
import { toolInfos, toolsHub, type ToolInfo } from "@/data/tools";
import { personRef } from "@/lib/personSchema";

export default function ToolSeo({ tool }: { tool: ToolInfo }) {
  const url = `${site.url}/tools/${tool.id}`;
  const nodes = [
    {
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: tool.seo.heading,
      alternateName: tool.name,
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
      author: personRef,
    },
    faqNode(tool.seo.faq),
    {
      "@type": "HowTo",
      name: `How to use the ${tool.name} tool`,
      step: tool.seo.steps.map((text, index) => ({ "@type": "HowToStep", position: index + 1, text })),
    },
    breadcrumbNode(["Tools", `${site.url}${toolsHub.path}`], [tool.name, url]),
  ];

  return (
    <>
      <JsonLd nodes={nodes} />
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
        <h2>More free tools</h2>
        <ul>
          <li>
            <Link href={toolsHub.path}>All free tools</Link>
          </li>
          {toolInfos
            .filter((other) => other.id !== tool.id)
            .map((other) => (
              <li key={other.id}>
                <Link href={`/tools/${other.id}`}>{other.name}</Link>: {other.description}
              </li>
            ))}
        </ul>
        <p>
          <Link href="/mcp">How to use this tool from an AI assistant (MCP)</Link>
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
