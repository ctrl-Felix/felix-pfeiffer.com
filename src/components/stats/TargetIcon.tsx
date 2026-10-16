import { FinderIcon, GithubIcon, MailIcon, ProfileIcon, ReaderIcon, RecruiterIcon, SeoIcon, ShieldIcon, StatsIcon, ToolsIcon } from "@/components/Icons";

const icons: Record<string, () => React.JSX.Element> = {
  finder: FinderIcon,
  profile: ProfileIcon,
  recruiter: RecruiterIcon,
  github: GithubIcon,
  mail: MailIcon,
  seo: SeoIcon,
  vulnerabilities: ShieldIcon,
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
