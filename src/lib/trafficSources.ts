import { publicPaths } from "@/data/publicPaths";

export type SourceGroup = "ai" | "web" | "direct";

type SourceInfo = { label: string; group: SourceGroup; hosts?: string[]; pattern?: RegExp };

export const trafficSources = {
  chatgpt: { label: "ChatGPT", group: "ai", hosts: ["chatgpt.com", "chat.openai.com", "openai.com"] },
  claude: { label: "Claude", group: "ai", hosts: ["claude.ai"] },
  perplexity: { label: "Perplexity", group: "ai", hosts: ["perplexity.ai"] },
  gemini: { label: "Gemini", group: "ai", hosts: ["gemini.google.com", "bard.google.com"] },
  copilot: { label: "Copilot", group: "ai", hosts: ["copilot.microsoft.com", "copilot.cloud.microsoft"] },
  deepseek: { label: "DeepSeek", group: "ai", hosts: ["deepseek.com"] },
  mistral: { label: "Le Chat", group: "ai", hosts: ["chat.mistral.ai"] },
  grok: { label: "Grok", group: "ai", hosts: ["grok.com"] },
  metaai: { label: "Meta AI", group: "ai", hosts: ["meta.ai"] },
  you: { label: "You.com", group: "ai", hosts: ["you.com"] },
  google: { label: "Google", group: "web", pattern: /^(?:[a-z0-9-]+\.)*google\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/ },
  bing: { label: "Bing", group: "web", hosts: ["bing.com"] },
  duckduckgo: { label: "DuckDuckGo", group: "web", hosts: ["duckduckgo.com"] },
  ecosia: { label: "Ecosia", group: "web", hosts: ["ecosia.org"] },
  brave: { label: "Brave Search", group: "web", hosts: ["search.brave.com"] },
  yahoo: { label: "Yahoo", group: "web", hosts: ["yahoo.com"] },
  yandex: { label: "Yandex", group: "web", hosts: ["ya.ru"], pattern: /^(?:[a-z0-9-]+\.)*yandex\.[a-z.]{2,6}$/ },
  baidu: { label: "Baidu", group: "web", hosts: ["baidu.com"] },
  startpage: { label: "Startpage", group: "web", hosts: ["startpage.com"] },
  qwant: { label: "Qwant", group: "web", hosts: ["qwant.com"] },
  linkedin: { label: "LinkedIn", group: "web", hosts: ["linkedin.com", "lnkd.in"] },
  github: { label: "GitHub", group: "web", hosts: ["github.com"] },
  x: { label: "X", group: "web", hosts: ["x.com", "twitter.com", "t.co"] },
  reddit: { label: "Reddit", group: "web", hosts: ["reddit.com"] },
  hackernews: { label: "Hacker News", group: "web", hosts: ["news.ycombinator.com"] },
  other: { label: "Other websites", group: "web" },
  direct: { label: "Direct", group: "direct" },
} satisfies Record<string, SourceInfo>;

export type TrafficSource = keyof typeof trafficSources;

export const sourceGroups: { id: SourceGroup; label: string }[] = [
  { id: "web", label: "Web" },
  { id: "ai", label: "AI" },
  { id: "direct", label: "Direct" },
];

const hostPattern = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/;

export const isTrafficSource = (value: unknown): value is TrafficSource => typeof value === "string" && Object.hasOwn(trafficSources, value);

function matchHost(host: string): TrafficSource | null {
  for (const [id, info] of Object.entries(trafficSources) as [TrafficSource, SourceInfo][]) {
    if (info.hosts?.some((candidate) => host === candidate || host.endsWith(`.${candidate}`))) return id;
    if (info.pattern?.test(host)) return id;
  }
  return null;
}

function fromCampaign(value: string): TrafficSource | null {
  const name = value.trim().toLowerCase();
  if (!name || name.length > 100) return null;
  if (isTrafficSource(name) && name !== "other" && name !== "direct") return name;
  if (hostPattern.test(name)) return matchHost(name);
  return null;
}

export function classifySource(referrer: unknown, campaign: unknown, ownHost: string): TrafficSource {
  const fromUtm = typeof campaign === "string" ? fromCampaign(campaign) : null;
  if (fromUtm) return fromUtm;
  if (typeof referrer !== "string" || !referrer) return "direct";
  const host = referrer.trim().toLowerCase().replace(/^www\./, "");
  if (!hostPattern.test(host)) return host === "localhost" ? "direct" : "other";
  if (host === ownHost || host.endsWith(`.${ownHost}`)) return "direct";
  return matchHost(host) ?? "other";
}

export const otherLanding = "other";

const landingPaths = new Set(publicPaths.map((entry) => entry.path));

export function landingPath(path: unknown) {
  if (typeof path !== "string") return otherLanding;
  const trimmed = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return landingPaths.has(trimmed) ? trimmed : otherLanding;
}
