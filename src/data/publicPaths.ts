import { site } from "@/config";
import { aboutPage } from "./about";
import { mcpPage } from "./mcp";
import { toolInfos, toolsHub } from "./tools";

export type PathGroup = "site" | "tools" | "ai";

export type PublicPath = {
  path: string;
  title: string;
  description: string;
  kind: "desktop" | "tool" | "page" | "file";
  group: PathGroup;
  parent?: string;
  toolId?: string;
  indexed: boolean;
  updated?: string;
  icon?: "logo" | "stats" | "paths" | "tools";
};

export const pathGroups: { id: PathGroup; title: string }[] = [
  { id: "site", title: "Site" },
  { id: "tools", title: "Tools" },
  { id: "ai", title: "For AI assistants" },
];

export const publicPaths: PublicPath[] = [
  {
    path: "/",
    title: "Desktop",
    description: "The main interface: the macOS style desktop with all apps.",
    kind: "desktop",
    group: "site",
    indexed: true,
  },
  {
    path: aboutPage.path,
    title: "About Felix Pfeiffer",
    description: "Full profile as a plain page: experience, ventures, education, open source and skills.",
    kind: "page",
    group: "site",
    indexed: true,
    updated: aboutPage.updated,
    icon: "logo",
  },
  {
    path: "/stats",
    title: "Visitor statistics",
    description: "Public, anonymous visitor statistics as a standalone page. The same data is in the Stats app.",
    kind: "page",
    group: "site",
    indexed: false,
    icon: "stats",
  },
  {
    path: toolsHub.path,
    title: "All tools",
    description: "Overview of all free tools. Opens the desktop with the Tools app maximized.",
    kind: "tool",
    group: "tools",
    indexed: true,
    updated: toolsHub.updated,
    icon: "tools",
  },
  ...toolInfos.map((tool): PublicPath => ({
    path: `/tools/${tool.id}`,
    title: tool.name,
    description: `Opens the desktop with Tools and ${tool.name} maximized. ${tool.description}`,
    kind: "tool",
    group: "tools",
    parent: toolsHub.path,
    toolId: tool.id,
    indexed: true,
    updated: tool.updated,
  })),
  {
    path: mcpPage.path,
    title: "MCP server",
    description: "Explains MCP and the single address (POST) that gives AI assistants the whois and DNS tools.",
    kind: "page",
    group: "ai",
    indexed: true,
    updated: mcpPage.updated,
    icon: "paths",
  },
  {
    path: "/llms.txt",
    title: "llms.txt",
    description: "Plain text summary of this site and its tools for AI assistants and search.",
    kind: "file",
    group: "ai",
    indexed: false,
    icon: "paths",
  },
];

export const absoluteUrl = (path: string) => (path === "/" ? site.url : `${site.url}${path}`);
