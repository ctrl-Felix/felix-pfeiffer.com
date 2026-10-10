"use client";

import { trackClick } from "@/lib/track";
import type { App } from "./apps";
import type { WindowState } from "./windows/context";

type Props = {
  app: App;
  win: WindowState | undefined;
  open: (id: string) => void;
  close: (id: string) => void;
  minimize: (id: string) => void;
  onDone: () => void;
};

export default function DockMenu({ app, win, open, close, minimize, onDone }: Props) {
  const items: { label: string; run: () => void }[] = [];

  if (win) {
    items.push(win.minimized ? { label: "Show", run: () => open(app.id) } : { label: "Minimize", run: () => minimize(app.id) });
    items.push({ label: "Close Window", run: () => close(app.id) });
  } else if (app.window) {
    items.push({
      label: "Open",
      run: () => {
        trackClick(app.id);
        open(app.id);
      },
    });
  }

  if (app.href) {
    items.push({
      label: app.external ? "Open in Browser" : "Open",
      run: () => {
        trackClick(app.id);
        if (app.external) window.open(app.href, "_blank", "noopener,noreferrer");
        else window.location.assign(app.href!);
      },
    });
  }

  return (
    <ul
      role="menu"
      data-dock-menu
      className="absolute bottom-full left-1/2 z-10 mb-3 min-w-40 -translate-x-1/2 rounded-xl bg-[#f5f5f7]/80 p-1.5 text-[13px] text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-200"
    >
      <li className="px-2.5 py-1 text-xs font-semibold text-black/50">{app.label}</li>
      <li role="separator" className="my-1 h-px bg-black/10" />
      {items.map((item) => (
        <li key={item.label} role="none">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onDone();
              item.run();
            }}
            className="flex w-full whitespace-nowrap rounded-md px-2.5 py-1 text-left hover:bg-[#0a84ff] hover:text-white"
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
