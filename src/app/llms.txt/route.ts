import { links, site } from "@/config";
import { absoluteUrl, publicPaths } from "@/data/publicPaths";

export function GET() {
  const tools = publicPaths
    .filter((entry) => entry.kind === "tool")
    .map((entry) => `- [${entry.title}](${absoluteUrl(entry.path)}): ${entry.description}`)
    .join("\n");
  const body = `# ${site.name}\n\n> ${site.description}\n\n${site.summary}\n\n- [Website](${site.url})\n- [GitHub](${links.github})\n- [LinkedIn](${links.linkedin})\n\n## Tools\n\n${tools}\n\n## MCP\n\n- [How to connect AI assistants to the MCP servers](${site.url}/mcp-servers)\n- [Whois MCP server](${site.url}/mcp): Streamable HTTP MCP endpoint without login. Tool: whois_lookup (registrar, dates, status, name servers, DNSSEC).\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
