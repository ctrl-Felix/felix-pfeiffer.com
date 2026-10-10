import { links } from "@/config";
import FinderWindow from "./FinderWindow";
import { FinderIcon, GithubIcon, MailIcon, MarkdownFileIcon, PathsIcon, ProfileIcon, ReaderIcon, StatsIcon, StocksIcon, ToolsIcon } from "./Icons";
import MailWindow from "./MailWindow";
import PathsWindow from "./paths/PathsWindow";
import ProfileWindow from "./ProfileWindow";
import ReaderWindow from "./reader/ReaderWindow";
import SecurityWindow from "./reader/SecurityWindow";
import StatsWindow from "./stats/StatsWindow";
import TokenUsageWindow from "./tokens/TokenUsageWindow";
import StocksApp from "./stocks/StocksApp";
import ToolsApp from "./tools/ToolsApp";

export type App = {
  id: string;
  label: string;
  Icon: () => React.JSX.Element;
  href?: string;
  external?: boolean;
  hidden?: boolean;
  transient?: boolean;
  desktopIcon?: () => React.JSX.Element;
  desktopLabel?: string;
  desktopAnchor?: "bottom-right";
  window?: {
    Content: React.ComponentType;
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
  };
};

export const apps: App[] = [
  {
    id: "profile",
    label: "Profile",
    Icon: ProfileIcon,
    window: { Content: ProfileWindow, width: 880, height: 620, minWidth: 560, minHeight: 400 },
  },
  { id: "github", label: "GitHub", Icon: GithubIcon, href: links.github, external: true },
  {
    id: "mail",
    label: "Mail",
    Icon: MailIcon,
    window: { Content: MailWindow, width: 640, height: 520, minWidth: 420, minHeight: 360 },
  },
  {
    id: "stocks",
    label: "Stocks",
    Icon: StocksIcon,
    transient: true,
    window: { Content: StocksApp, width: 860, height: 600, minWidth: 560, minHeight: 440 },
  },
  {
    id: "tools",
    label: "Tools",
    Icon: ToolsIcon,
    transient: true,
    window: { Content: ToolsApp, width: 720, height: 560, minWidth: 420, minHeight: 340 },
  },
  {
    id: "reader",
    label: "Reader",
    Icon: ReaderIcon,
    transient: true,
    desktopIcon: MarkdownFileIcon,
    desktopLabel: "README.md",
    desktopAnchor: "bottom-right",
    window: { Content: ReaderWindow, width: 640, height: 480, minWidth: 360, minHeight: 280 },
  },
  {
    id: "security",
    label: "Security",
    Icon: ReaderIcon,
    transient: true,
    desktopIcon: MarkdownFileIcon,
    desktopLabel: "Security.md",
    desktopAnchor: "bottom-right",
    window: { Content: SecurityWindow, width: 640, height: 480, minWidth: 360, minHeight: 280 },
  },
  {
    id: "stats",
    label: "Stats",
    Icon: StatsIcon,
    transient: true,
    window: { Content: StatsWindow, width: 760, height: 640, minWidth: 420, minHeight: 360 },
  },
];

export const finder: App = {
  id: "finder",
  label: "Finder",
  Icon: FinderIcon,
  window: { Content: FinderWindow, width: 560, height: 380, minWidth: 320, minHeight: 240 },
};

export const pathsApp: App = {
  id: "paths",
  label: "Public Paths",
  Icon: PathsIcon,
  hidden: true,
  window: { Content: PathsWindow, width: 720, height: 540, minWidth: 420, minHeight: 340 },
};

export const tokensApp: App = {
  id: "tokens",
  label: "Token Usage",
  Icon: StatsIcon,
  hidden: true,
  window: { Content: TokenUsageWindow, width: 460, height: 420, minWidth: 340, minHeight: 300 },
};

export const allApps = [finder, ...apps, pathsApp, tokensApp];

export const visibleApps = allApps.filter((app) => !app.hidden);
