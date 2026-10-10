import { FinderIcon, GithubIcon, MailIcon, ProfileIcon, ReaderIcon, StatsIcon, StocksIcon, ToolsIcon } from "@/components/Icons";

const icons: Record<string, () => React.JSX.Element> = {
  finder: FinderIcon,
  profile: ProfileIcon,
  github: GithubIcon,
  mail: MailIcon,
  stocks: StocksIcon,
  stats: StatsIcon,
  tools: ToolsIcon,
  reader: ReaderIcon,
  security: ReaderIcon,
};

export default function TargetIcon({ target }: { target: string }) {
  const Icon = icons[target];
  if (Icon) return <span className="block h-9 w-9 shrink-0"><Icon /></span>;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-sm font-semibold">
      {target.slice(0, 1).toUpperCase()}
    </span>
  );
}
