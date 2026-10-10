import { dnsTool } from "./dns";
import { whoisTool } from "./whois";
import type { McpTool } from "./types";

export const mcpTools: McpTool[] = [whoisTool, dnsTool];
