import { links } from "@/config";
import { CvIcon, GithubIcon, MailIcon } from "./Icons";

const items = [
  { label: "CV.pdf", href: links.cv, Icon: CvIcon, external: true },
  { label: "GitHub", href: links.github, Icon: GithubIcon, external: true },
  { label: "Mail", href: links.mail, Icon: MailIcon, external: false },
];

export default function DesktopIcons() {
  return (
    <div className="absolute right-4 top-12 z-10 flex flex-col items-center gap-4">
      {items.map(({ label, href, Icon, external }) => (
        <a
          key={label}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="group flex w-24 flex-col items-center gap-1 rounded-lg p-1 outline-none"
        >
          <span className="block h-16 w-16 transition-transform group-active:scale-95">
            <Icon />
          </span>
          <span className="rounded px-1.5 text-xs font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)] group-hover:bg-blue-500/80 group-focus-visible:bg-blue-500/80">
            {label}
          </span>
        </a>
      ))}
    </div>
  );
}
