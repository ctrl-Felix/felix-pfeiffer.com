"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { App } from "@/components/apps";
import Window, { MENU_HEIGHT } from "./Window";
import type { WindowActions, WindowState } from "./context";

type WindowsValue = WindowActions & { windows: WindowState[]; focusedId: string | null };

const WindowsContext = createContext<WindowsValue | null>(null);

export function useWindows() {
  const value = useContext(WindowsContext);
  if (!value) throw new Error("useWindows must be used inside WindowProvider");
  return value;
}

const MOBILE_WIDTH = 768;
const CASCADE = 28;

function topZ(windows: WindowState[]) {
  return windows.reduce((top, win) => Math.max(top, win.z), 0);
}

function createWindow(app: App, existing: WindowState[]): WindowState {
  const config = app.window!;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(config.width, viewportWidth - 24);
  const height = Math.min(config.height, viewportHeight - MENU_HEIGHT - 120);
  const shift = (existing.length % 5) * CASCADE;
  return {
    id: app.id,
    title: app.label,
    x: Math.max(12, (viewportWidth - width) / 2 - 56 + shift),
    y: Math.max(MENU_HEIGHT + 8, (viewportHeight - height) / 2 - 24 + shift),
    width,
    height,
    z: topZ(existing) + 1,
    minimized: false,
    maximized: viewportWidth < MOBILE_WIDTH,
  };
}

export function WindowProvider({ apps, children }: { apps: App[]; children: React.ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>([]);

  const update = useCallback((id: string, change: (win: WindowState, all: WindowState[]) => Partial<WindowState>) => {
    setWindows((all) => all.map((win) => (win.id === id ? { ...win, ...change(win, all) } : win)));
  }, []);

  const actions = useMemo<WindowActions>(
    () => ({
      open: (id) =>
        setWindows((all) => {
          const app = apps.find((candidate) => candidate.id === id);
          if (!app?.window) return all;
          const existing = all.find((win) => win.id === id);
          if (!existing) return [...all, createWindow(app, all)];
          return all.map((win) => (win.id === id ? { ...win, minimized: false, z: topZ(all) + 1 } : win));
        }),
      close: (id) => setWindows((all) => all.filter((win) => win.id !== id)),
      focus: (id) =>
        setWindows((all) => {
          const target = all.find((win) => win.id === id);
          if (!target || (target.z === topZ(all) && !target.minimized)) return all;
          return all.map((win) => (win.id === id ? { ...win, z: topZ(all) + 1, minimized: false } : win));
        }),
      minimize: (id) => update(id, () => ({ minimized: true })),
      toggleMaximize: (id) => update(id, (win) => ({ maximized: !win.maximized })),
      setBounds: (id, bounds) => update(id, () => bounds),
    }),
    [apps, update],
  );

  const focusedId = useMemo(() => {
    const visible = windows.filter((win) => !win.minimized);
    return visible.length ? visible.reduce((top, win) => (win.z > top.z ? win : top)).id : null;
  }, [windows]);

  const value = useMemo(() => ({ ...actions, windows, focusedId }), [actions, windows, focusedId]);

  return (
    <WindowsContext.Provider value={value}>
      {children}
      {windows.map((win) => {
        const app = apps.find((candidate) => candidate.id === win.id);
        return app ? <Window key={win.id} win={win} app={app} focused={win.id === focusedId} actions={actions} /> : null;
      })}
    </WindowsContext.Provider>
  );
}
