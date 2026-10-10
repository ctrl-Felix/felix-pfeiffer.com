import { site } from "@/config";

export type McpTool = { name: string; description: string; example: string };

export type McpConnector = {
  id: string;
  name: string;
  description: string;
  path: string;
  tools: McpTool[];
};

export const mcpConnectors: McpConnector[] = [
  {
    id: "whois",
    name: "Whois",
    description: "Domain registration lookup: registrar, dates, name servers and DNSSEC.",
    path: "/mcp/whois",
    tools: [
      {
        name: "whois_lookup",
        description: "Looks up a domain via RDAP, with a WHOIS fallback. Returns status, registrar, dates, name servers and DNSSEC.",
        example: "When does example.com expire and who is its registrar?",
      },
    ],
  },
];

export const mcpPage = {
  path: "/mcp",
  updated: "2026-10-11",
  title: "MCP Servers for AI Assistants: Free Whois Lookup",
  description:
    "What MCP is and how to connect Claude, Claude Code, Cursor or VS Code to free MCP servers, starting with a whois lookup. No account or API key.",
  heading: "MCP servers: connect your AI assistant",
  keywords: ["mcp", "model context protocol", "mcp server", "claude connector", "whois mcp", "remote mcp server", "claude code mcp"],
  intro:
    "The Model Context Protocol (MCP) lets AI assistants such as Claude call tools and fetch live data. The servers below are open: no account, no API key.",
  faq: [
    {
      question: "What is MCP?",
      answer: "MCP, the Model Context Protocol, is an open standard that lets AI assistants connect to tools and data sources through a common interface.",
    },
    {
      question: "Do I need an account or API key?",
      answer: "No. The servers on this page are free and open. They only limit how many requests one address can send per minute.",
    },
    {
      question: "Are my requests stored?",
      answer: "No. A request is answered, cached for a few minutes and never saved.",
    },
    {
      question: "Which assistants work with these servers?",
      answer: "Any client that supports remote MCP servers over Streamable HTTP, for example Claude, Claude Code, Cursor and VS Code.",
    },
  ],
};

export const mcpServerUrl = (connector: McpConnector) => `${site.url}${connector.path}`;

export type ClientSetup = { id: string; name: string; steps?: string; hint?: string; code?: (url: string) => string };

export const clientSetups: ClientSetup[] = [
  {
    id: "claude",
    name: "Claude",
    steps: "Open Settings, then Connectors, choose Add custom connector and paste the server URL.",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    code: (url: string) => `claude mcp add --transport http whois ${url}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    hint: "Add to ~/.cursor/mcp.json",
    code: (url: string) => JSON.stringify({ mcpServers: { whois: { url } } }, null, 2),
  },
  {
    id: "vscode",
    name: "VS Code",
    hint: "Add to .vscode/mcp.json",
    code: (url: string) => JSON.stringify({ servers: { whois: { type: "http", url } } }, null, 2),
  },
];
