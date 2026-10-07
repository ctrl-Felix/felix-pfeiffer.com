import { links } from "@/config";
import { FinderIcon, GithubIcon, MailIcon, ProfileIcon } from "./Icons";

export type App = {
  id: string;
  label: string;
  Icon: () => React.JSX.Element;
  href?: string;
  external?: boolean;
};

export const apps: App[] = [
  { id: "profile", label: "Profile", Icon: ProfileIcon },
  { id: "github", label: "GitHub", Icon: GithubIcon, href: links.github, external: true },
  { id: "mail", label: "Mail", Icon: MailIcon },
];

export const finder: App = { id: "finder", label: "Finder", Icon: FinderIcon };
