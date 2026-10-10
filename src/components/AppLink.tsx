import { trackClick } from "@/lib/track";
import type { App } from "./apps";

type Props = {
  app: App;
  onOpen: (id: string) => void;
  className?: string;
  onContextMenu?: React.MouseEventHandler;
  children: React.ReactNode;
};

export default function AppLink({ app, onOpen, className, onContextMenu, children }: Props) {
  if (app.href) {
    return (
      <a
        href={app.href}
        onClick={() => trackClick(app.id)}
        onContextMenu={onContextMenu}
        aria-label={app.label}
        {...(app.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      aria-label={app.label}
      onClick={() => {
        trackClick(app.id);
        onOpen(app.id);
      }}
      onContextMenu={onContextMenu}
      className={className}
    >
      {children}
    </button>
  );
}
