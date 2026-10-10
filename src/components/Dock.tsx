"use client";

import { useEffect, useState } from "react";
import AppLink from "./AppLink";
import DockMenu from "./DockMenu";
import { visibleApps } from "./apps";
import { useWindows } from "./windows/WindowManager";

const leaveMs = 400;

function useLeaving(wantedIds: string[]) {
  const key = wantedIds.join(",");
  const [state, setState] = useState({ key, leaving: [] as string[] });

  if (state.key !== key) {
    const previous = state.key ? state.key.split(",") : [];
    const removed = previous.filter((id) => !wantedIds.includes(id));
    setState({ key, leaving: [...state.leaving.filter((id) => !wantedIds.includes(id)), ...removed] });
  }

  useEffect(() => {
    if (!state.leaving.length) return;
    const timer = setTimeout(() => setState((current) => ({ ...current, leaving: [] })), leaveMs);
    return () => clearTimeout(timer);
  }, [state.leaving]);

  return state.leaving;
}

export default function Dock() {
  const { windows, open, close, minimize } = useWindows();
  const [menuId, setMenuId] = useState<string | null>(null);
  const openIds = windows.map((win) => win.id);
  const wantedTransient = visibleApps.filter((app) => app.transient && openIds.includes(app.id)).map((app) => app.id);
  const leaving = useLeaving(wantedTransient);
  const items = visibleApps.filter((app) => !app.transient || wantedTransient.includes(app.id) || leaving.includes(app.id));

  useEffect(() => {
    if (!menuId) return;
    const dismiss = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest("[data-dock-menu]")) setMenuId(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuId(null);
    };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", escape);
    };
  }, [menuId]);

  return (
    <nav className="glass fixed bottom-3 left-1/2 z-[9000] flex -translate-x-1/2 items-end rounded-[28px] px-[5px] py-2.5">
      {items.map((app) => {
        const slotClass = !app.transient ? "" : leaving.includes(app.id) ? "dock-leaving" : "dock-entering";
        return (
          <div key={app.id} className={`dock-slot ${slotClass}`}>
            {menuId === app.id && (
              <DockMenu app={app} win={windows.find((win) => win.id === app.id)} open={open} close={close} minimize={minimize} onDone={() => setMenuId(null)} />
            )}
            <div className="shrink-0">
              <AppLink
                app={app}
                onOpen={open}
                onContextMenu={(event) => {
                  event.preventDefault();
                  setMenuId(app.id);
                }}
                className="group relative block h-14 w-14 cursor-default select-none active:brightness-75 sm:h-16 sm:w-16"
              >
                <app.Icon />
                {openIds.includes(app.id) && (
                  <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white/90" />
                )}
                <span className={`glass pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium opacity-0 transition-opacity ${menuId === app.id ? "" : "group-hover:opacity-100"}`}>
                  {app.label}
                </span>
              </AppLink>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
