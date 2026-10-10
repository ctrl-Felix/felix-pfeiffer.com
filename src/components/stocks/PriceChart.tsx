"use client";

import { useId } from "react";
import { formatPrice, negativeColor, positiveColor } from "./format";

type Props = {
  points: [number, number][];
  baseline: number;
  showBaseline: boolean;
  positive: boolean;
  hover: number | null;
  onHover: (index: number | null) => void;
};

const padding = 8;
const gridLines = 4;

export default function PriceChart({ points, baseline, showBaseline, positive, hover, onHover }: Props) {
  const gradientId = useId();
  const values = points.map((point) => point[1]);
  const min = Math.min(...values, ...(showBaseline ? [baseline] : []));
  const max = Math.max(...values, ...(showBaseline ? [baseline] : []));
  const span = max - min || 1;
  const x = (index: number) => (index / Math.max(values.length - 1, 1)) * 100;
  const y = (value: number) => 100 - padding - ((value - min) / span) * (100 - padding * 2);
  const color = positive ? positiveColor : negativeColor;
  const line = values.map((value, index) => `${index ? "L" : "M"}${x(index)},${y(value)}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;
  const active = hover === null ? null : Math.min(hover, values.length - 1);

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    onHover(Math.round(ratio * (values.length - 1)));
  };

  return (
    <div
      className="relative h-full min-h-40 w-full touch-pan-y select-none"
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={() => onHover(null)}
    >
      {Array.from({ length: gridLines }, (_, index) => {
        const value = max - ((max - min) * (index + 0.5)) / gridLines;
        return (
          <div key={index} className="pointer-events-none absolute inset-x-0 border-t border-white/10" style={{ top: `${y(value)}%` }}>
            <span className="absolute right-0 -translate-y-full text-[10px] tabular-nums text-white/40">{formatPrice(value)}</span>
          </div>
        );
      })}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.28" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        {showBaseline && (
          <line x1="0" x2="100" y1={y(baseline)} y2={y(baseline)} stroke="white" strokeOpacity="0.45" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        )}
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {active !== null && (
        <>
          <div className="pointer-events-none absolute inset-y-0 w-px bg-white/40" style={{ left: `${x(active)}%` }} />
          <div
            className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
            style={{ left: `${x(active)}%`, top: `${y(values[active])}%`, background: color }}
          />
        </>
      )}
    </div>
  );
}
