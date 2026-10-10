export const trackTargets = {
  finder: "Finder",
  profile: "Profile",
  github: "GitHub",
  mail: "Mail",
  seo: "SEO tracker",
  tools: "Tools",
  stats: "Stats",
  paths: "Public paths",
  tokens: "Token usage",
  mcp: "MCP",
  reader: "README",
  security: "Security",
  linkedin: "LinkedIn",
  email: "Email",
} as const;

export const mcpTargets = {
  whois_lookup: "Whois lookup",
  dns_records: "DNS records",
} as const;

export type McpTarget = keyof typeof mcpTargets;

export const isMcpTarget = (value: unknown): value is McpTarget => typeof value === "string" && Object.hasOwn(mcpTargets, value);

export const legacyTargets: Record<string, string> = { stocks: "Stocks" };

export type TrackTarget = keyof typeof trackTargets;

export const isTrackTarget = (value: unknown): value is TrackTarget =>
  typeof value === "string" && Object.hasOwn(trackTargets, value);
