import type { Chart } from "@/data/caseTest/types";

export default function CaseChart({ chart }: { chart: Chart }) {
  const max = Math.max(...chart.bars.map((bar) => bar.value));
  const slot = 300 / chart.bars.length;
  return (
    <figure className="space-y-1">
      <figcaption className="text-[12px] font-medium text-black/60">
        {chart.title} ({chart.unit})
      </figcaption>
      <svg viewBox="0 0 320 170" className="w-full max-w-md text-[#1d1d1f]" role="img" aria-label={`${chart.title}: ${chart.bars.map((bar) => `${bar.label} ${bar.value}`).join(", ")}`}>
        <line x1={10} y1={140} x2={310} y2={140} stroke="currentColor" strokeOpacity={0.25} />
        {chart.bars.map((bar, index) => {
          const height = (bar.value / max) * 110;
          const x = 10 + index * slot + slot * 0.2;
          return (
            <g key={bar.label}>
              <rect x={x} y={140 - height} width={slot * 0.6} height={height} rx={3} fill="#0a84ff" />
              <text x={x + slot * 0.3} y={134 - height} textAnchor="middle" fontSize={11} fill="currentColor">
                {bar.value}
              </text>
              <text x={x + slot * 0.3} y={156} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.6}>
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
