"use client";

import { useWindow } from "./context";

const glyphs = {
  close: "M3 3l6 6M9 3l-6 6",
  minimize: "M3 6h6",
  zoom: "M3.5 8.5v-5h5M8.5 3.5v5h-5",
};

function Light({ label, color, glyph, onClick, focused }: { label: string; color: string; glyph: string; onClick: () => void; focused: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-3 w-3 items-center justify-center rounded-full shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)]"
      style={{ background: focused ? color : "#bdbdc2" }}
    >
      <svg viewBox="0 0 12 12" className="h-3 w-3 opacity-0 group-hover/lights:opacity-70" fill="none" stroke="black" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d={glyph} />
      </svg>
    </button>
  );
}

export default function TrafficLights({ className = "" }: { className?: string }) {
  const { focused, close, minimize, toggleMaximize } = useWindow();
  return (
    <div className={`group/lights flex items-center gap-2 ${className}`}>
      <Light label="Close" color="#ff5f57" glyph={glyphs.close} onClick={close} focused={focused} />
      <Light label="Minimize" color="#febc2e" glyph={glyphs.minimize} onClick={minimize} focused={focused} />
      <Light label="Zoom" color="#28c840" glyph={glyphs.zoom} onClick={toggleMaximize} focused={focused} />
    </div>
  );
}
