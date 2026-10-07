import { links } from "@/config";
import { CvIcon, FinderIcon, GithubIcon, MailIcon } from "./Icons";

const items = [
  { label: "Finder", href: "/", Icon: FinderIcon, external: false },
  { label: "Mail", href: links.mail, Icon: MailIcon, external: false },
  { label: "GitHub", href: links.github, Icon: GithubIcon, external: true },
  { label: "CV", href: links.cv, Icon: CvIcon, external: true },
];

export default function Dock() {
  return (
    <nav className="glass fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-end gap-3 rounded-[26px] px-3 py-2.5">
      {items.map(({ label, href, Icon, external }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="group relative block h-14 w-14 origin-bottom transition-transform duration-200 ease-out hover:-translate-y-2 hover:scale-125 sm:h-16 sm:w-16"
        >
          <Icon />
          <span className="glass pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            {label}
          </span>
        </a>
      ))}
    </nav>
  );
}
