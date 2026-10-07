import AppLink from "./AppLink";
import { apps } from "./apps";

export default function DesktopIcons({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="absolute right-4 top-12 z-10 flex flex-col items-center gap-4">
      {apps.map((app) => (
        <AppLink
          key={app.id}
          app={app}
          onOpen={onOpen}
          className="group flex w-24 cursor-default flex-col items-center gap-1 rounded-lg p-1 outline-none"
        >
          <span className="block h-16 w-16 transition-transform group-active:scale-95">
            <app.Icon />
          </span>
          <span className="rounded px-1.5 text-xs font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] group-hover:bg-white/25 group-focus-visible:bg-white/25">
            {app.label}
          </span>
        </AppLink>
      ))}
    </div>
  );
}
