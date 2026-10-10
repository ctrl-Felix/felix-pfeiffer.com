import { trackClick } from "@/lib/track";
import type { App } from "./apps";

type Props = { app: App; onOpen: (id: string) => void; className?: string; children: React.ReactNode };

export default function AppLink({ app, onOpen, className, children }: Props) {
  if (app.href) {
    return (
      <a
        href={app.href}
        onClick={() => trackClick(app.id)}
        aria-label={app.label}
        {...(app.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" aria-label={app.label} onClick={() => {
        trackClick(app.id);
        onOpen(app.id);
      }} className={className}>
      {children}
    </button>
  );
}
