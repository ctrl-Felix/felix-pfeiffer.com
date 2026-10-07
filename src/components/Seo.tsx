import { links, site } from "@/config";
import { profile } from "@/data/profile";

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
  knowsAbout: profile.skills.flatMap((skill) => skill.value.split(", ")),
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
        {[
          ["Experience", profile.experience],
          ["Ventures", profile.ventures],
          ["Education", profile.education],
        ].map(([heading, entries]) => (
          <section key={heading as string}>
            <h2>{heading as string}</h2>
            {(entries as typeof profile.experience).map((entry) => (
              <article key={entry.title + entry.org}>
                <h3>{entry.title}, {entry.org} ({entry.period})</h3>
                <ul>{entry.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </article>
            ))}
          </section>
        ))}
        <h2>Skills</h2>
        <ul>{profile.skills.map((skill) => <li key={skill.label}>{skill.label}: {skill.value}</li>)}</ul>
        <ul>
          <li><a href={links.github}>GitHub</a></li>
          <li><a href={links.linkedin}>LinkedIn</a></li>
        </ul>
      </div>
    </>
  );
}
