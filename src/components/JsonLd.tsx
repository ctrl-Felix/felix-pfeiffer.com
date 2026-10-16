import { site } from "@/config";

type Faq = { question: string; answer: string }[];

export const faqNode = (faq: Faq) => ({
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
});

export const breadcrumbNode = (...trail: [name: string, url: string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [[site.name, site.url], ...trail].map(([name, item], index) => ({ "@type": "ListItem", position: index + 1, name, item })),
});

export default function JsonLd({ nodes }: { nodes: object[] }) {
  const graph = { "@context": "https://schema.org", "@graph": nodes };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
