export const trackTargets = {
  finder: "Finder",
  profile: "Profile",
  github: "GitHub",
  mail: "Mail",
  stocks: "Stocks",
  tools: "Tools",
  stats: "Stats",
  paths: "Public paths",
  mcp: "MCP",
  reader: "README",
  linkedin: "LinkedIn",
  email: "Email",
} as const;

export type TrackTarget = keyof typeof trackTargets;

export const isTrackTarget = (value: unknown): value is TrackTarget =>
  typeof value === "string" && Object.hasOwn(trackTargets, value);
