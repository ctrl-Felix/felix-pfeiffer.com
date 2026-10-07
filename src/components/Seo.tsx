import { links, site } from "@/config";

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  description: site.description,
  jobTitle: "Information Security Student",
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "University College London" },
    { "@type": "CollegeOrUniversity", name: "University of Bonn" },
  ],
  worksFor: { "@type": "Organization", name: "Pakt" },
  address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" },
  sameAs: [links.github, links.linkedin],
};

export default function Seo() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }}
      />
      <div className="sr-only">
        <h1>{site.name}</h1>
        <p>{site.summary}</p>
        <ul>
          <li><a href={links.github}>GitHub</a></li>
          <li><a href={links.linkedin}>LinkedIn</a></li>
        </ul>
      </div>
    </>
  );
}
