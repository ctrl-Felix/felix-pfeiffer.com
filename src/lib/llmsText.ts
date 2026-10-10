import { links, site } from "@/config";
import { aboutPage } from "@/data/about";
import { mcpConnectors } from "@/data/mcp";
import { profile, type Entry } from "@/data/profile";
import { absoluteUrl, publicPaths } from "@/data/publicPaths";

const entryLines = (entries: Entry[]) =>
  entries.map((entry) => `- ${entry.title}, ${entry.org} (${entry.period}): ${entry.points.join(". ")}.`).join("\n");

export function llmsText() {
  const facts = aboutPage.facts.map((fact) => `- ${fact.label}: ${fact.value}`).join("\n");
  const openSource = profile.openSource.map((project) => `- [${project.name}](${project.url}): ${project.description}`).join("\n");
  const tools = publicPaths
    .filter((entry) => entry.kind === "tool")
    .map((entry) => `- [${entry.title}](${absoluteUrl(entry.path)}): ${entry.description}`)
    .join("\n");
  const mcpTools = mcpConnectors.flatMap((connector) => connector.tools.map((tool) => `${tool.name} (${tool.description})`)).join("; ");
  const faq = aboutPage.faq.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n");

  return `# ${site.name}

> ${aboutPage.lead}

${site.summary}

## Profile

- [About ${site.name}](${absoluteUrl(aboutPage.path)}): full profile with experience, ventures, education and skills
- [Website](${site.url})
- [GitHub (ctrl-Felix)](${links.github})
- [LinkedIn (felixpf)](${links.linkedin})
- Email: ${links.email}

## Key facts

${facts}

## Experience

${entryLines(profile.experience)}

## Ventures

${entryLines(profile.ventures)}

## Education

${entryLines(profile.education)}

## Open source

${openSource}

## Skills

${profile.skills.map((skill) => `- ${skill.label}: ${skill.value}`).join("\n")}

## Questions

${faq}

## Tools

${tools}

## MCP

- [MCP server and how to connect AI assistants](${site.url}/mcp): the same address answers MCP requests (Streamable HTTP, POST, no login). Tools: ${mcpTools}
`;
}
