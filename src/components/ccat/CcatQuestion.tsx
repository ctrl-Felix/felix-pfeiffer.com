import type { Figure } from "@/data/ccat/types";
import type { PoolQuestion } from "@/lib/ccat";
import { isFigure } from "@/lib/ccatFigure";
import CcatFigure from "./CcatFigure";

const letters = ["A", "B", "C", "D", "E"];

type Props = {
  question: PoolQuestion;
  choice: number | null;
  onChoose?: (index: number) => void;
  review?: boolean;
};

function Box({ figure, small }: { figure: Figure | null; small?: boolean }) {
  return (
    <div className={`flex aspect-square items-center justify-center rounded-lg bg-white text-[#1d1d1f] shadow-[0_0_0_1px_rgba(0,0,0,0.12)] ${small ? "w-14 sm:w-16" : "w-full"}`}>
      {figure ? <CcatFigure figure={figure} /> : <span className="text-2xl font-semibold text-black/35">?</span>}
    </div>
  );
}

function Body({ question }: { question: PoolQuestion }) {
  const { stem, lines, pairs, table, sequence, matrix } = question;
  return (
    <>
      {stem && <p className={question.kind === "Antonym" ? "text-xl font-semibold tracking-wide" : "text-[15px] font-medium leading-relaxed"}>{stem}</p>}
      {lines && (
        <div className="space-y-1 text-[15px]">
          {lines.slice(0, -1).map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p className="border-t border-black/10 pt-2 font-semibold">{lines.at(-1)}</p>
        </div>
      )}
      {pairs && (
        <table className="w-full max-w-md font-mono text-[14px]">
          <tbody>
            {pairs.map(([left, right], index) => (
              <tr key={index} className="border-b border-black/5 last:border-0">
                <td className="w-6 py-1 text-black/40">{index + 1}</td>
                <td className="py-1 pr-4">{left}</td>
                <td className="py-1">{right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {table && (
        <div className="overflow-x-auto">
          <table className="text-[14px] tabular-nums">
            <tbody>
              {table.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex === 0 ? "font-semibold" : ""}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-black/10 bg-white px-3 py-1 text-center">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sequence && (
        <div className="flex flex-wrap items-center gap-2">
          {sequence.map((figure, index) => (
            <Box key={index} figure={figure} small />
          ))}
          <Box figure={null} small />
        </div>
      )}
      {matrix && (
        <div className="grid w-48 grid-cols-3 gap-1.5 sm:w-56">
          {matrix.map((figure, index) => (
            <Box key={index} figure={figure} />
          ))}
        </div>
      )}
    </>
  );
}

function optionTone(index: number, { question, choice, review }: Props) {
  if (review && index === question.answer) return "bg-[#34c759]/15 shadow-[0_0_0_2px_#34c759]";
  if (review && index === choice) return "bg-[#ff3b30]/10 shadow-[0_0_0_2px_#ff3b30]";
  if (!review && index === choice) return "bg-[#0a84ff]/10 shadow-[0_0_0_2px_#0a84ff]";
  return "bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]";
}

export default function CcatQuestion(props: Props) {
  const { question, onChoose, review } = props;
  const figures = question.options.every(isFigure);
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-black/55">{question.prompt}</p>
      <Body question={question} />
      <div className={figures ? "grid grid-cols-3 gap-2 sm:grid-cols-5" : "space-y-1.5"}>
        {question.options.map((option, index) => (
          <button
            key={index}
            type="button"
            disabled={review}
            onClick={() => onChoose?.(index)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] ${figures ? "flex-col" : "w-full"} ${optionTone(index, props)} ${review ? "cursor-default" : "hover:bg-white"}`}
          >
            <span className="w-4 shrink-0 text-[12px] font-semibold text-black/45">{letters[index]}</span>
            {isFigure(option) ? (
              <span className="block w-full max-w-20">
                <Box figure={option} />
              </span>
            ) : (
              <span>{option}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
