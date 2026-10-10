"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import type { App } from "@/components/apps";
import { WindowContext, type Bounds, type WindowActions, type WindowControls, type WindowState } from "./context";

export const MENU_HEIGHT = 28;
const DOCK_RESERVE = 96;
const NON_DRAG_TARGETS = "button, a, input, textarea, select, label";

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const handles: { edge: Edge; className: string }[] = [
  { edge: "n", className: "inset-x-3 top-0 h-1.5 cursor-ns-resize" },
  { edge: "s", className: "inset-x-3 bottom-0 h-1.5 cursor-ns-resize" },
  { edge: "w", className: "inset-y-3 left-0 w-1.5 cursor-ew-resize" },
  { edge: "e", className: "inset-y-3 right-0 w-1.5 cursor-ew-resize" },
  { edge: "nw", className: "left-0 top-0 h-3 w-3 cursor-nwse-resize" },
  { edge: "ne", className: "right-0 top-0 h-3 w-3 cursor-nesw-resize" },
  { edge: "sw", className: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize" },
  { edge: "se", className: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize" },
];

const Body = memo(function Body({ Content }: { Content: React.ComponentType }) {
  return <Content />;
});

function track(event: React.PointerEvent, onMove: (dx: number, dy: number) => void) {
  const startX = event.clientX;
  const startY = event.clientY;
  const move = (moveEvent: PointerEvent) => onMove(moveEvent.clientX - startX, moveEvent.clientY - startY);
  const stop = () => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
    document.body.style.userSelect = "";
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
  document.body.style.userSelect = "none";
}

function resized(start: Bounds, edge: Edge, dx: number, dy: number, minWidth: number, minHeight: number): Bounds {
  let { x, y, width, height } = start;
  if (edge.includes("e")) width = Math.max(minWidth, start.width + dx);
  if (edge.includes("s")) height = Math.max(minHeight, start.height + dy);
  if (edge.includes("w")) {
    width = Math.max(minWidth, start.width - dx);
    x = start.x + start.width - width;
  }
  if (edge.includes("n")) {
    const bottom = start.y + start.height;
    y = Math.min(Math.max(MENU_HEIGHT, start.y + dy), bottom - minHeight);
    height = bottom - y;
  }
  return { x, y, width, height };
}

function minimizedTransform(win: WindowState) {
  const centerX = win.maximized ? window.innerWidth / 2 : win.x + win.width / 2;
  const centerY = win.maximized ? window.innerHeight / 2 : win.y + win.height / 2;
  return `translate(${window.innerWidth / 2 - centerX}px, ${window.innerHeight - 48 - centerY}px) scale(0.1)`;
}

type Props = { win: WindowState; app: App; focused: boolean; actions: WindowActions };

export default function Window({ win, app, focused, actions }: Props) {
  const latest = useRef(win);
  useEffect(() => {
    latest.current = win;
  }, [win]);

  const { id } = win;
  const { close, focus, minimize, toggleMaximize, setBounds } = actions;
  const minWidth = app.window?.minWidth ?? 320;
  const minHeight = app.window?.minHeight ?? 240;

  const startDrag = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0 || latest.current.maximized) return;
      if ((event.target as HTMLElement).closest(NON_DRAG_TARGETS)) return;
      const { x, y, width } = latest.current;
      track(event, (dx, dy) =>
        setBounds(id, {
          x: Math.min(Math.max(x + dx, 80 - width), window.innerWidth - 80),
          y: Math.min(Math.max(y + dy, MENU_HEIGHT), window.innerHeight - 48),
        }),
      );
    },
    [id, setBounds],
  );

  const startResize = (edge: Edge) => (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const start = latest.current;
    track(event, (dx, dy) => setBounds(id, resized(start, edge, dx, dy, minWidth, minHeight)));
  };

  const controls = useMemo<WindowControls>(
    () => ({
      focused,
      maximized: win.maximized,
      close: () => close(id),
      minimize: () => minimize(id),
      toggleMaximize: () => toggleMaximize(id),
      dragProps: {
        onPointerDown: startDrag,
        onDoubleClick: (event) => {
          if (!(event.target as HTMLElement).closest(NON_DRAG_TARGETS)) toggleMaximize(id);
        },
      },
    }),
    [focused, win.maximized, id, close, minimize, toggleMaximize, startDrag],
  );

  const placement = win.maximized
    ? { left: 0, right: 0, top: MENU_HEIGHT, bottom: DOCK_RESERVE }
    : { left: win.x, top: win.y, width: win.width, height: win.height };

  return (
    <div
      role="dialog"
      aria-label={app.label}
      aria-hidden={win.minimized}
      inert={win.minimized}
      onPointerDownCapture={() => focus(id)}
      className={`window-pop fixed overflow-hidden backdrop-blur-3xl backdrop-saturate-200 transition-[transform,opacity,box-shadow] duration-300 ease-out ${win.maximized ? "rounded-2xl" : "rounded-[26px]"} ${focused ? "shadow-[0_30px_80px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(0,0,0,0.3)]" : "shadow-[0_12px_36px_rgba(0,0,0,0.25),0_0_0_0.5px_rgba(0,0,0,0.2)]"}`}
      style={{
        ...placement,
        zIndex: 100 + win.z,
        transformOrigin: "center",
        ...(win.minimized ? { transform: minimizedTransform(win), opacity: 0, pointerEvents: "none" } : {}),
      }}
    >
      <WindowContext.Provider value={controls}>
        {app.window && <Body Content={app.window.Content} />}
      </WindowContext.Provider>
      {!win.maximized &&
        handles.map(({ edge, className }) => (
          <div key={edge} onPointerDown={startResize(edge)} className={`absolute z-10 ${className}`} />
        ))}
    </div>
  );
}
