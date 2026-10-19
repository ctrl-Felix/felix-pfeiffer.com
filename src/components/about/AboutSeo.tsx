import JsonLd, { breadcrumbNode, faqNode } from "@/components/JsonLd";
import { site } from "@/config";
import { aboutPage } from "@/data/about";
import { profile } from "@/data/profile";
import { organizationNode, personId, personNode, websiteId, websiteNode } from "@/lib/personSchema";
import { schemaDateTime } from "@/lib/schemaDate";

export default function AboutSeo() {
  const url = `${site.url}${aboutPage.path}`;
  const nodes = [
    {
      "@type": "ProfilePage",
      "@id": `${url}#page`,
      url,
      name: aboutPage.title,
      description: aboutPage.description,
      inLanguage: "en",
      dateModified: schemaDateTime(aboutPage.updated),
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
    faqNode(aboutPage.faq),
    breadcrumbNode(["About", url]),
  ];
  return <JsonLd nodes={nodes} />;
}
