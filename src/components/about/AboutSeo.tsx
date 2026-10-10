import { site } from "@/config";
import { aboutPage } from "@/data/about";
import { profile } from "@/data/profile";
import { organizationNode, personId, personNode, websiteId, websiteNode } from "@/lib/personSchema";

export default function AboutSeo() {
  const url = `${site.url}${aboutPage.path}`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#page`,
        url,
        name: aboutPage.title,
        description: aboutPage.description,
        inLanguage: "en",
        dateModified: aboutPage.updated,
        isPartOf: { "@id": websiteId },
        about: { "@id": personId },
        mainEntity: personNode(),
      },
      websiteNode,
      ...profile.ventures.map((venture) => ({
        ...organizationNode(venture.org),
        description: venture.points[0],
        founder: { "@id": personId },
      })),
      ...profile.openSource.map((project) => ({
        "@type": "SoftwareSourceCode",
        name: project.name,
        description: project.description,
        codeRepository: project.url,
        programmingLanguage: "Python",
        author: { "@id": personId },
      })),
      {
        "@type": "FAQPage",
        mainEntity: aboutPage.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: site.name, item: site.url },
          { "@type": "ListItem", position: 2, name: "About", item: url },
        ],
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
