"use client";

import { useState } from "react";
import { formatSeconds } from "@/lib/ccat";
import { isCorrect, scoreCaseTest, type CaseAnswer as Answer, type CaseQuestion } from "@/lib/caseTest";
import CaseAnswer from "./CaseAnswer";
import CaseContext from "./CaseContext";

type Props = {
  questions: CaseQuestion[];
  answers: Answer[];
  seconds: number[];
  onRestart: () => void;
};

export default function CaseResults({ questions, answers, seconds, onRestart }: Props) {
  const [onlyMissed, setOnlyMissed] = useState(false);
  const score = scoreCaseTest(questions, answers, seconds);
  const shown = questions.map((question, index) => ({ question, index })).filter(({ question, index }) => !onlyMissed || !isCorrect(question.item, answers[index]));

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <section className="rounded-2xl bg-white/80 p-4 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
        <p className="text-4xl font-semibold tabular-nums">
          {score.correct} <span className="text-black/35">/ {questions.length}</span>
        </p>
        <p className="mt-1 text-[13px] text-black/55">
          {Math.round((score.correct / questions.length) * 100)}% correct · {formatSeconds(score.totalSeconds)} in total · {Math.round(score.averageSeconds)} s per question
        </p>
      </section>
      <section className={`grid gap-2 ${score.bySection.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {score.bySection.map((section) => (
          <div key={section.id} className="rounded-xl bg-white/80 p-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <p className="text-[12px] text-black/55">{section.label}</p>
            <p className="text-lg font-semibold tabular-nums">
              {section.correct}/{section.total}
            </p>
            <p className="text-[12px] text-black/50">{Math.round(section.seconds / section.total)} s per question</p>
          </div>
        ))}
      </section>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={onlyMissed} onChange={(event) => setOnlyMissed(event.target.checked)} />
          Only show mistakes
        </label>
        <button type="button" onClick={onRestart} className="rounded-lg bg-[#34c759] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#2fb350]">
          New test
        </button>
      </div>
      {shown.map(({ question, index }) => {
        const correct = isCorrect(question.item, answers[index]);
        const first = index === 0 || questions[index - 1].set !== question.set;
        return (
          <article key={question.key} className="space-y-3">
            {(first || onlyMissed) && <CaseContext set={question.set} />}
            <div className="space-y-3 rounded-2xl bg-white/60 p-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="text-black/45">
                  {index + 1}. {formatSeconds(seconds[index] ?? 0)}
                </span>
                <span className={`font-semibold ${correct ? "text-[#248a3d]" : "text-[#d70015]"}`}>{correct ? "Correct" : "Wrong"}</span>
              </div>
              <p className="text-[14px] font-medium">{question.item.prompt}</p>
              <CaseAnswer item={question.item} value={answers[index]} review />
              <p className="text-[13px] text-black/70">{question.item.explanation}</p>
            </div>
          </article>
        );
      })}
      {!shown.length && <p className="text-center text-[13px] text-black/50">No mistakes. Well done.</p>}
    </div>
  );
}
