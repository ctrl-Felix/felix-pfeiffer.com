import { dnsTool } from "./dns";
import { ipTool } from "./ip";
import { subdomainsTool } from "./subdomains";
import { whoisTool } from "./whois";
import type { McpTool } from "./types";

export const mcpTools: McpTool[] = [whoisTool, dnsTool, subdomainsTool, ipTool];
