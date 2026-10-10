import { links } from "@/config";
import FinderWindow from "./FinderWindow";
import { FinderIcon, GithubIcon, MailIcon, ProfileIcon, StatsIcon, StocksIcon, ToolsIcon } from "./Icons";
import MailWindow from "./MailWindow";
import ProfileWindow from "./ProfileWindow";
import StatsWindow from "./stats/StatsWindow";
import StocksApp from "./stocks/StocksApp";
import ToolsApp from "./tools/ToolsApp";

export type App = {
  id: string;
  label: string;
  Icon: () => React.JSX.Element;
  href?: string;
  external?: boolean;
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
    window: { Content: StocksApp, width: 860, height: 600, minWidth: 560, minHeight: 440 },
  },
  {
    id: "tools",
    label: "Tools",
    Icon: ToolsIcon,
    window: { Content: ToolsApp, width: 720, height: 560, minWidth: 420, minHeight: 340 },
  },
  {
    id: "stats",
    label: "Stats",
    Icon: StatsIcon,
    window: { Content: StatsWindow, width: 760, height: 640, minWidth: 420, minHeight: 360 },
  },
];

export const finder: App = {
  id: "finder",
  label: "Finder",
  Icon: FinderIcon,
  window: { Content: FinderWindow, width: 560, height: 380, minWidth: 320, minHeight: 240 },
};

export const allApps = [finder, ...apps];
