import { negativeColor, positiveColor } from "./format";

export default function Sparkline({ points, positive }: { points: [number, number][]; positive: boolean }) {
  const values = points.map((point) => point[1]);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const path = values
    .map((value, index) => `${index ? "L" : "M"}${(index / Math.max(values.length - 1, 1)) * 100},${90 - ((value - min) / span) * 80}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-7 w-16 shrink-0" aria-hidden>
      <path d={path} fill="none" stroke={positive ? positiveColor : negativeColor} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
