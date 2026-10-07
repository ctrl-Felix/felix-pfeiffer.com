import AppLink from "./AppLink";
import { apps, finder } from "./apps";

export default function Dock({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <nav className="glass fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-end gap-2.5 rounded-[28px] p-2.5">
      {[finder, ...apps].map((app) => (
        <AppLink
          key={app.id}
          app={app}
          onOpen={onOpen}
          className="group relative block h-14 w-14 origin-bottom cursor-default transition-transform duration-200 ease-out hover:-translate-y-2 hover:scale-125 sm:h-16 sm:w-16"
        >
          <app.Icon />
          <span className="glass pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
            {app.label}
          </span>
        </AppLink>
      ))}
    </nav>
  );
}
