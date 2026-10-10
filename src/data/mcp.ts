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
    id: "security",
    name: "Security research",
    description: "One server with several read only lookup tools. Connect once and use all of them.",
    path: "/mcp",
    tools: [
      {
        name: "whois_lookup",
        description: "Registration data of a domain via RDAP, with a WHOIS fallback: registrar, dates, statuses, name servers and DNSSEC.",
        example: "When does example.com expire and who is its registrar?",
      },
      {
        name: "dns_records",
        description: "DNS records of a domain through public resolvers: A, AAAA, CNAME, MX, NS, TXT, SOA and CAA.",
        example: "Which mail servers and SPF policy does example.com use?",
      },
    ],
  },
];

export const mcpPage = {
  path: "/mcp",
  updated: "2026-10-11",
  title: "Free MCP Server for AI Assistants: Whois and DNS Lookup",
  description:
    "Connect Claude, Claude Code, Cursor or VS Code to one free MCP server with whois and DNS record lookup tools. No account or API key.",
  heading: "MCP server: connect your AI assistant",
  keywords: ["mcp", "model context protocol", "mcp server", "claude connector", "whois mcp", "dns mcp", "remote mcp server", "claude code mcp"],
  intro:
    "The Model Context Protocol (MCP) lets AI assistants such as Claude call tools and fetch live data. The server below is open: no account, no API key. It offers several tools behind one address.",
  faq: [
    {
      question: "What is MCP?",
      answer: "MCP, the Model Context Protocol, is an open standard that lets AI assistants connect to tools and data sources through a common interface.",
    },
    {
      question: "Do I need an account or API key?",
      answer: "No. The server on this page is free and open. It only limits how many requests one address can send per minute.",
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
    code: (url: string) => `claude mcp add --transport http security ${url}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    hint: "Add to ~/.cursor/mcp.json",
    code: (url: string) => JSON.stringify({ mcpServers: { security: { url } } }, null, 2),
  },
  {
    id: "vscode",
    name: "VS Code",
    hint: "Add to .vscode/mcp.json",
    code: (url: string) => JSON.stringify({ servers: { security: { type: "http", url } } }, null, 2),
  },
];
