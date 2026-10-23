import type { CaseSet } from "@/data/caseTest/types";
import CaseChart from "./CaseChart";

export default function CaseContext({ set }: { set: CaseSet }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
      <h3 className="text-[13px] font-semibold text-black/60">{set.title}</h3>
      {set.context.map((paragraph) => (
        <p key={paragraph} className={`text-[14px] leading-relaxed ${paragraph.startsWith("Subject:") ? "font-semibold" : ""}`}>
          {paragraph}
        </p>
      ))}
      {set.table && (
        <div className="overflow-x-auto">
          <table className="text-[13px] tabular-nums">
            <tbody>
              {set.table.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className={`border border-black/10 px-3 py-1 ${rowIndex === 0 || cellIndex === 0 ? "bg-black/[0.04] font-semibold" : "text-right"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {set.chart && <CaseChart chart={set.chart} />}
    </section>
  );
}
