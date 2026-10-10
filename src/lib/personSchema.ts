import { links, site } from "@/config";
import { organizations } from "@/data/organizations";
import { profile, type Entry } from "@/data/profile";

export const personId = `${site.url}/#person`;
export const websiteId = `${site.url}/#website`;

export const personRef = { "@type": "Person", "@id": personId, name: site.name, url: site.url };

export function organizationNode(name: string) {
  const info = organizations[name];
  return {
    "@type": info?.type ?? "Organization",
    name,
    ...(info?.fullName ? { alternateName: info.fullName } : {}),
    ...(info?.sameAs ? { sameAs: info.sameAs } : {}),
    ...(info?.parent ? { parentOrganization: { "@type": "Organization", name: info.parent.name, sameAs: info.parent.sameAs } } : {}),
  };
}

const organizationsOf = (entries: Entry[]) => [...new Set(entries.map((entry) => entry.org))].map(organizationNode);

const educationAndWork: Entry[] = [...profile.education, ...profile.experience];

export const knowsAbout = [
  "Information security",
  ...profile.skills.flatMap((skill) => skill.value.split(", ")),
];

export function personNode() {
  return {
    ...personRef,
    givenName: "Felix",
    familyName: "Pfeiffer",
    description: site.description,
    jobTitle: "Information Security Student",
    affiliation: organizationsOf(profile.education.filter((entry) => entry.current)),
    alumniOf: organizationsOf(educationAndWork.filter((entry) => !entry.current)),
    worksFor: organizationsOf(profile.ventures.filter((entry) => entry.current)),
    homeLocation: { "@type": "Place", name: profile.location },
    address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
    knowsLanguage: ["German", "French", "English"],
    knowsAbout,
    sameAs: [links.github, links.linkedin],
  };
}

export const websiteNode = {
  "@type": "WebSite",
  "@id": websiteId,
  url: site.url,
  name: site.name,
  description: site.description,
  inLanguage: "en",
  author: { "@id": personId },
  publisher: { "@id": personId },
};
