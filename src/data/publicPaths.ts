import { site } from "@/config";
import { mcpPage } from "./mcp";
import { toolInfos } from "./tools";

export type PublicPath = {
  path: string;
  title: string;
  description: string;
  kind: "desktop" | "tool" | "page" | "api";
  toolId?: string;
  indexed: boolean;
  updated?: string;
  icon?: "logo" | "stats" | "paths";
};

export const publicPaths: PublicPath[] = [
  {
    path: "/",
    title: "Desktop",
    description: "The main interface: the macOS style desktop with all apps.",
    kind: "desktop",
    indexed: true,
  },
  ...toolInfos.map((tool): PublicPath => ({
    path: `/tools/${tool.id}`,
    title: tool.name,
    description: `Opens the desktop with Tools and ${tool.name} maximized. ${tool.description}`,
    kind: "tool",
    toolId: tool.id,
    indexed: true,
    updated: tool.updated,
  })),
  {
    path: "/stats",
    title: "Visitor statistics",
    description: "Public, anonymous visitor statistics as a standalone page. The same data is in the Stats app.",
    kind: "page",
    indexed: false,
    icon: "stats",
  },
  {
    path: mcpPage.path,
    title: "MCP servers",
    description: "Explains MCP and how to connect AI assistants to the open servers on this site.",
    kind: "page",
    indexed: true,
    updated: mcpPage.updated,
    icon: "paths",
  },
  {
    path: "/mcp/whois",
    title: "Whois MCP server",
    description: "Model Context Protocol endpoint (Streamable HTTP, no login) that gives AI assistants the whois_lookup tool. Not a web page.",
    kind: "api",
    indexed: false,
    icon: "paths",
  },
];

export const absoluteUrl = (path: string) => (path === "/" ? site.url : `${site.url}${path}`);
