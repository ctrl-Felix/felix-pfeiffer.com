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

export const legacyTargets: Record<string, string> = { stocks: "Stocks" };

export type TrackTarget = keyof typeof trackTargets;

export const isTrackTarget = (value: unknown): value is TrackTarget =>
  typeof value === "string" && Object.hasOwn(trackTargets, value);
