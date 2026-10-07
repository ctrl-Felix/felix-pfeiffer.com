import { useRef, useState } from "react";

export function useDrag() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const handlers = {
    onPointerDown: (event: React.PointerEvent) => {
      if ((event.target as HTMLElement).closest("button, a")) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      start.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (!start.current) return;
      setOffset({
        x: start.current.ox + event.clientX - start.current.x,
        y: start.current.oy + event.clientY - start.current.y,
      });
    },
    onPointerUp: () => {
      start.current = null;
    },
  };

  return { offset, handlers };
}
