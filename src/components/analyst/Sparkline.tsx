export default function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-black/30">–</span>;
  const width = 64;
  const height = 20;
  const low = Math.min(...values);
  const span = Math.max(...values) - low || 1;
  const points = values.map((value, index) => `${((index / (values.length - 1)) * width).toFixed(1)},${(height - 1 - ((value - low) / span) * (height - 2)).toFixed(1)}`);
  const rising = values[values.length - 1] >= values[0];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="block">
      <polyline points={points.join(" ")} fill="none" stroke={rising ? "#0a7d3b" : "#c4281e"} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
