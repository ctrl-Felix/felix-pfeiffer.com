import { overMinuteLimit } from "../rateLimit";

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
  call: (args: unknown, ip: string) => Promise<ToolResult>;
};

export const toolError = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });

export const isoDay = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");

export const toolSummary = ({ name, title, description, inputSchema, outputSchema }: McpTool) => ({
  name,
  title,
  description,
  inputSchema,
  outputSchema,
  annotations: { title, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
});

type Lookup<T> = {
  bucket: string;
  ip: string;
  perIp: number;
  global: number;
  run: () => Promise<T>;
  summarize: (data: T) => string;
  failure: (error: unknown) => string;
};

export async function runLookup<T>({ bucket, ip, perIp, global, run, summarize, failure }: Lookup<T>): Promise<ToolResult> {
  if (overMinuteLimit(bucket, ip, perIp, global)) return toolError("Rate limit reached. Please try again in a minute.");
  try {
    const data = await run();
    return { content: [{ type: "text", text: summarize(data) }], structuredContent: data };
  } catch (error) {
    return toolError(failure(error));
  }
}
