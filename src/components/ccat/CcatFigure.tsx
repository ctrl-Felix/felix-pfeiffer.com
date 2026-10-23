import type { Figure, Glyph, Shape } from "@/data/ccat/types";

const polygon = (sides: number, radius: number) =>
  Array.from({ length: sides }, (_, index) => {
    const angle = (index / sides) * 2 * Math.PI - Math.PI / 2;
    return `${(radius * Math.cos(angle)).toFixed(3)},${(radius * Math.sin(angle)).toFixed(3)}`;
  }).join(" ");

const star = Array.from({ length: 10 }, (_, index) => {
  const angle = (index / 10) * 2 * Math.PI - Math.PI / 2;
  const radius = index % 2 ? 0.4 : 0.95;
  return `${(radius * Math.cos(angle)).toFixed(3)},${(radius * Math.sin(angle)).toFixed(3)}`;
}).join(" ");

const points: Partial<Record<Shape, string>> = {
  triangle: "0,-0.95 0.823,0.475 -0.823,0.475",
  diamond: "0,-1 0.65,0 0,1 -0.65,0",
  pentagon: polygon(5, 0.92),
  hexagon: polygon(6, 0.92),
  star,
  cross: "-0.28,-0.85 0.28,-0.85 0.28,-0.28 0.85,-0.28 0.85,0.28 0.28,0.28 0.28,0.85 -0.28,0.85 -0.28,0.28 -0.85,0.28 -0.85,-0.28 -0.28,-0.28",
  arrow: "0,-0.95 0.6,-0.3 0.22,-0.3 0.22,0.95 -0.22,0.95 -0.22,-0.3 -0.6,-0.3",
  hook: "-0.55,-0.95 -0.1,-0.95 -0.1,0.5 0.6,0.5 0.6,0.95 -0.55,0.95",
};

function GlyphShape({ glyph }: { glyph: Glyph }) {
  const fill = glyph.solid ? "currentColor" : "none";
  const line = { stroke: "currentColor", strokeWidth: 2, vectorEffect: "non-scaling-stroke" as const, strokeLinejoin: "round" as const };
  switch (glyph.shape) {
    case "circle":
      return <circle r={0.9} fill={fill} {...line} />;
    case "dot":
      return <circle r={0.5} fill="currentColor" />;
    case "square":
      return <rect x={-0.75} y={-0.75} width={1.5} height={1.5} fill={fill} {...line} />;
    case "flag":
      return (
        <>
          <rect x={-0.55} y={-0.95} width={0.14} height={1.9} fill="currentColor" />
          <polygon points="-0.41,-0.95 0.7,-0.6 -0.41,-0.25" fill={fill} {...line} />
        </>
      );
    case "clock":
      return (
        <>
          <circle r={0.9} fill="none" {...line} />
          <line x1={0} y1={0} x2={0} y2={-0.7} {...line} strokeLinecap="round" />
          <circle r={0.1} fill="currentColor" />
        </>
      );
    case "half":
      return (
        <>
          <path d="M -0.9 0 A 0.9 0.9 0 0 1 0.9 0 Z" fill="currentColor" />
          <circle r={0.9} fill="none" {...line} />
        </>
      );
    default:
      return <polygon points={points[glyph.shape]} fill={fill} {...line} />;
  }
}

function placements(figure: Figure) {
  if (figure.some((glyph) => glyph.cell !== undefined)) {
    return figure.map((glyph) => {
      const cell = glyph.cell ?? 4;
      return { glyph, x: ((cell % 3) + 0.5) * (100 / 3), y: (Math.floor(cell / 3) + 0.5) * (100 / 3), size: 11 };
    });
  }
  const columns = figure.length <= 1 ? 1 : figure.length <= 4 ? 2 : figure.length <= 9 ? 3 : 4;
  const rows = Math.ceil(figure.length / columns);
  const cell = 84 / Math.max(columns, rows);
  return figure.map((glyph, index) => {
    const row = Math.floor(index / columns);
    const inRow = Math.min(columns, figure.length - row * columns);
    return {
      glyph,
      x: 50 - (inRow * cell) / 2 + cell * ((index % columns) + 0.5),
      y: 50 - (rows * cell) / 2 + cell * (row + 0.5),
      size: Math.min(cell * 0.38, 28),
    };
  });
}

export default function CcatFigure({ figure }: { figure: Figure }) {
  const gridded = figure.some((glyph) => glyph.cell !== undefined);
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      {gridded && (
        <g stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} vectorEffect="non-scaling-stroke">
          <line x1={33.3} y1={4} x2={33.3} y2={96} vectorEffect="non-scaling-stroke" />
          <line x1={66.7} y1={4} x2={66.7} y2={96} vectorEffect="non-scaling-stroke" />
          <line x1={4} y1={33.3} x2={96} y2={33.3} vectorEffect="non-scaling-stroke" />
          <line x1={4} y1={66.7} x2={96} y2={66.7} vectorEffect="non-scaling-stroke" />
        </g>
      )}
      {placements(figure).map(({ glyph, x, y, size }, index) => (
        <g key={index} transform={`translate(${x} ${y}) rotate(${glyph.rotation ?? 0}) scale(${glyph.mirror ? -size : size} ${size})`}>
          <GlyphShape glyph={glyph} />
        </g>
      ))}
    </svg>
  );
}
