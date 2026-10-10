"use client";

import { useEffect, useRef, useState } from "react";
import AppLink from "./AppLink";
import { apps } from "./apps";
import { useWindows } from "./windows/WindowManager";

type Spot = { col: number; row: number };
type Layout = Record<string, Spot>;
type Drag = { id: string; startX: number; startY: number; originX: number; originY: number; x: number; y: number; moved: boolean };

const cell = { width: 104, height: 112 };
const margin = { left: 12, top: 40 };
const reserveBottom = 110;
const dragThreshold = 4;
const storageKey = "desktop.icons";

function gridFor(width: number, height: number) {
  return {
    cols: Math.max(1, Math.floor((width - margin.left) / cell.width)),
    rows: Math.max(1, Math.floor((height - margin.top - reserveBottom) / cell.height)),
  };
}

function loadLayout(): Layout {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

function saveLayout(layout: Layout) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(layout));
  } catch {}
}

const key = (spot: Spot) => `${spot.col}:${spot.row}`;

function resolveLayout(saved: Layout, grid: { cols: number; rows: number }): Layout {
  const taken = new Set<string>();
  const resolved: Layout = {};
  const pending: string[] = [];

  for (const app of apps) {
    const spot = saved[app.id];
    const valid = spot && Number.isInteger(spot.col) && Number.isInteger(spot.row);
    const clamped = valid ? { col: Math.min(Math.max(spot.col, 0), grid.cols - 1), row: Math.min(Math.max(spot.row, 0), grid.rows - 1) } : null;
    if (clamped && !taken.has(key(clamped))) {
      resolved[app.id] = clamped;
      taken.add(key(clamped));
    } else pending.push(app.id);
  }

  const anchored = (id: string) => apps.find((app) => app.id === id)?.desktopAnchor === "bottom-right";
  const ordered = [...pending.filter(anchored), ...pending.filter((id) => !anchored(id))];

  for (const id of ordered) {
    const columns = Array.from({ length: grid.cols }, (_, index) => (anchored(id) ? grid.cols - 1 - index : index));
    const rows = Array.from({ length: grid.rows }, (_, index) => (anchored(id) ? grid.rows - 1 - index : index));
    for (const col of columns) {
      for (const row of rows) {
        if (!resolved[id] && !taken.has(key({ col, row }))) {
          resolved[id] = { col, row };
          taken.add(key({ col, row }));
        }
      }
    }
    if (!resolved[id]) resolved[id] = { col: 0, row: 0 };
  }
  return resolved;
}

function nearestFreeSpot(target: Spot, taken: Set<string>, grid: { cols: number; rows: number }): Spot | null {
  let best: Spot | null = null;
  let bestDistance = Infinity;
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      if (taken.has(key({ col, row }))) continue;
      const distance = (col - target.col) ** 2 + (row - target.row) ** 2;
      if (distance < bestDistance) {
        best = { col, row };
        bestDistance = distance;
      }
    }
  }
  return best;
}

const pixelsOf = (spot: Spot) => ({ x: margin.left + spot.col * cell.width, y: margin.top + spot.row * cell.height });

export default function DesktopIcons() {
  const { open } = useWindows();
  const [saved, setSaved] = useState<Layout>({});
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const justDragged = useRef(false);

  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    const frame = requestAnimationFrame(() => {
      measure();
      setSaved(loadLayout());
    });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (!viewport) return null;
  const grid = gridFor(viewport.width, viewport.height);
  const layout = resolveLayout(saved, grid);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, id: string) => {
    if (event.button !== 0) return;
    const origin = pixelsOf(layout[id]);
    setDrag({ id, startX: event.clientX, startY: event.clientY, originX: origin.x, originY: origin.y, x: origin.x, y: origin.y, moved: false });
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (drag && !drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > dragThreshold) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDrag((current) => {
      if (!current) return current;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      const moved = current.moved || Math.hypot(dx, dy) > dragThreshold;
      return moved ? { ...current, moved, x: current.originX + dx, y: current.originY + dy } : current;
    });
  };

  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) {
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 60);
      const target: Spot = {
        col: Math.min(Math.max(Math.round((drag.x - margin.left) / cell.width), 0), grid.cols - 1),
        row: Math.min(Math.max(Math.round((drag.y - margin.top) / cell.height), 0), grid.rows - 1),
      };
      const taken = new Set(Object.entries(layout).filter(([id]) => id !== drag.id).map(([, spot]) => key(spot)));
      const spot = taken.has(key(target)) ? nearestFreeSpot(target, taken, grid) : target;
      if (spot) {
        const next = { ...layout, [drag.id]: spot };
        setSaved(next);
        saveLayout(next);
      }
    }
    setDrag(null);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {apps.map((app) => {
        const dragging = drag?.moved && drag.id === app.id;
        const position = dragging ? { x: drag.x, y: drag.y } : pixelsOf(layout[app.id]);
        return (
          <div
            key={app.id}
            onPointerDown={(event) => startDrag(event, app.id)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDragStart={(event) => event.preventDefault()}
            onClickCapture={(event) => {
              if (justDragged.current) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            className={`pointer-events-auto absolute touch-none select-none ${dragging ? "z-20 opacity-80" : "transition-[left,top] duration-200 ease-out"}`}
            style={{ left: position.x, top: position.y, width: cell.width }}
          >
            <AppLink
              app={app}
              onOpen={open}
              className="group flex w-24 cursor-default flex-col items-center gap-1 rounded-lg p-1 outline-none"
            >
              <span className="block h-16 w-16 transition-transform group-active:scale-95">
                {app.desktopIcon ? <app.desktopIcon /> : <app.Icon />}
              </span>
              <span className="rounded px-1.5 text-xs font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] group-hover:bg-white/25 group-focus-visible:bg-white/25">
                {app.desktopLabel ?? app.label}
              </span>
            </AppLink>
          </div>
        );
      })}
    </div>
  );
}
