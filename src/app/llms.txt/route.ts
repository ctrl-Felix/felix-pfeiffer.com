import { links, site } from "@/config";
import { absoluteUrl, publicPaths } from "@/data/publicPaths";

export function GET() {
  const tools = publicPaths
    .filter((entry) => entry.kind === "tool")
    .map((entry) => `- [${entry.title}](${absoluteUrl(entry.path)}): ${entry.description}`)
    .join("\n");
  const body = `# ${site.name}\n\n> ${site.description}\n\n${site.summary}\n\n- [Website](${site.url})\n- [GitHub](${links.github})\n- [LinkedIn](${links.linkedin})\n\n## Tools\n\n${tools}\n\n## MCP\n\n- [MCP server and how to connect AI assistants](${site.url}/mcp): the same address answers MCP requests (Streamable HTTP, POST, no login). Tools: whois_lookup (registrar, dates, status, name servers, DNSSEC) and dns_records (A, AAAA, CNAME, MX, NS, TXT, SOA, CAA).\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
