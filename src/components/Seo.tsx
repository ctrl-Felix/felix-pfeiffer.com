import Link from "next/link";
import { links, site } from "@/config";
import { aboutPage } from "@/data/about";
import { profile } from "@/data/profile";
import { toolInfos } from "@/data/tools";
import { personNode, websiteNode } from "@/lib/personSchema";

const graph = { "@context": "https://schema.org", "@graph": [personNode(), websiteNode] };

export default function Seo() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <div className="sr-only">
        <h1>{site.name}</h1>
        <p>{site.summary}</p>
        <p><Link href={aboutPage.path}>Full profile of {site.name}</Link></p>
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
        <h2>Open source</h2>
        <ul>{profile.openSource.map((project) => <li key={project.name}><a href={project.url}>{project.name}</a>: {project.description}</li>)}</ul>
        <h2>Tools</h2>
        <ul>
          {toolInfos.map((tool) => (
            <li key={tool.id}><Link href={`/tools/${tool.id}`}>{tool.name}</Link>: {tool.description}</li>
          ))}
        </ul>
        <h2>For AI assistants</h2>
        <p><Link href="/mcp">MCP servers</Link>: connect Claude and other assistants to the open whois, DNS and subdomain tools.</p>
        <ul>
          <li><a href={links.github}>GitHub</a></li>
          <li><a href={links.linkedin}>LinkedIn</a></li>
        </ul>
      </div>
    </>
  );
}
