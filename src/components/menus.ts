import { allApps } from "./apps";
import { links } from "@/config";
import { trackClick } from "@/lib/track";
import type { WindowState } from "./windows/context";
import type { useWindows } from "./windows/WindowManager";

export type MenuItem = { label?: string; onSelect?: () => void; disabled?: boolean; checked?: boolean; separator?: boolean };
export type Menu = { id: string; label: string; bold?: boolean; compactHidden?: boolean; items: MenuItem[] };

type Windows = ReturnType<typeof useWindows>;

const separator: MenuItem = { separator: true };

function openApp(id: string, windows: Windows) {
  const app = allApps.find((candidate) => candidate.id === id);
  trackClick(id);
  if (app?.external && app.href) window.open(app.href, "_blank", "noopener,noreferrer");
  else if (app?.href) window.location.assign(app.href);
  else windows.open(id);
}

export function buildMenus(windows: Windows, active: WindowState | undefined): Menu[] {
  const hasWindow = active !== undefined;
  return [
    {
      id: "apple",
      label: "",
      items: [
        { label: "About Felix Pfeiffer", onSelect: () => windows.open("profile") },
        { label: "Public Paths…", onSelect: () => openApp("paths", windows) },
        separator,
        { label: "Restart…", onSelect: () => window.location.reload() },
      ],
    },
    {
      id: "app",
      label: active?.title ?? "Felix Pfeiffer",
      bold: true,
      items: [{ label: `Quit ${active?.title ?? ""}`.trim(), disabled: !hasWindow, onSelect: () => active && windows.close(active.id) }],
    },
    {
      id: "go",
      label: "Go",
      compactHidden: true,
      items: allApps
        .filter((app) => !app.hidden && (app.href || app.window))
        .map((app) => ({ label: app.external ? `${app.label} ↗` : app.label, onSelect: () => openApp(app.id, windows) })),
    },
    {
      id: "window",
      label: "Window",
      compactHidden: true,
      items: [
        { label: "Minimize", disabled: !hasWindow, onSelect: () => active && windows.minimize(active.id) },
        { label: "Zoom", disabled: !hasWindow, onSelect: () => active && windows.toggleMaximize(active.id) },
        { label: "Close Window", disabled: !hasWindow, onSelect: () => active && windows.close(active.id) },
        ...(windows.windows.length ? [separator] : []),
        ...windows.windows.map((win) => ({ label: win.title, checked: win.id === active?.id, onSelect: () => windows.open(win.id) })),
      ],
    },
    {
      id: "help",
      label: "Help",
      compactHidden: true,
      items: [
        { label: "Contact Felix…", onSelect: () => windows.open("mail") },
        { label: "Privacy & Statistics", onSelect: () => openApp("stats", windows) },
        { label: "Source Code on GitHub ↗", onSelect: () => window.open(links.source, "_blank", "noopener,noreferrer") },
      ],
    },
  ];
}
