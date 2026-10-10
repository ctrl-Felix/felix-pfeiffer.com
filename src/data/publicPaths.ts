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
    title: "MCP server",
    description: "Explains MCP and the single address (POST) that gives AI assistants the whois and DNS tools.",
    kind: "page",
    indexed: true,
    updated: mcpPage.updated,
    icon: "paths",
  },
];

export const absoluteUrl = (path: string) => (path === "/" ? site.url : `${site.url}${path}`);
