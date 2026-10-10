export type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: unknown;
  isError?: boolean;
};

export type McpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  annotations: Record<string, unknown>;
  call: (args: unknown, ip: string) => Promise<ToolResult>;
};

export const toolError = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });

export const toolSummary = ({ name, title, description, inputSchema, outputSchema, annotations }: McpTool) => ({
  name,
  title,
  description,
  inputSchema,
  outputSchema,
  annotations,
});
