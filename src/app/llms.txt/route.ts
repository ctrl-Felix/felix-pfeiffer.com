import { links, site } from "@/config";

export function GET() {
  const body = `# ${site.name}\n\n> ${site.description}\n\n${site.summary}\n\n- [Website](${site.url})\n- [GitHub](${links.github})\n- [LinkedIn](${links.linkedin})\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
