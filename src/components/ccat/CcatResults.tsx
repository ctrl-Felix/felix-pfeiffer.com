"use client";

import { useState } from "react";
import { formatSeconds, realTest, scoreTest, type Answer, type PoolQuestion } from "@/lib/ccat";
import { isFigure } from "@/lib/ccatFigure";
import CcatQuestion from "./CcatQuestion";

type Props = {
  questions: PoolQuestion[];
  answers: Answer[];
  seconds: number;
  limit: number;
  onRestart: () => void;
};

const letter = (index: number) => "ABCDE"[index];

function status(question: PoolQuestion, answer: Answer | undefined) {
  if (answer === undefined) return { label: "Not reached", tone: "text-black/45" };
  if (answer === null) return { label: "Skipped", tone: "text-[#ff9500]" };
  if (answer === question.answer) return { label: "Correct", tone: "text-[#248a3d]" };
  return { label: "Wrong", tone: "text-[#d70015]" };
}

function answerText(question: PoolQuestion, index: number) {
  const option = question.options[index];
  return isFigure(option) ? letter(index) : `${letter(index)}: ${option}`;
}

export default function CcatResults({ questions, answers, seconds, limit, onRestart }: Props) {
  const [onlyMissed, setOnlyMissed] = useState(false);
  const score = scoreTest(questions, answers);
  const scaled = Math.round((score.correct / questions.length) * realTest.questions);
  const shown = questions.map((question, index) => ({ question, index, answer: answers[index] })).filter(({ question, answer }) => !onlyMissed || answer !== question.answer);

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
      <section className="rounded-2xl bg-white/80 p-4 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
        <p className="text-4xl font-semibold tabular-nums">
          {score.correct} <span className="text-black/35">/ {questions.length}</span>
        </p>
        <p className="mt-1 text-[13px] text-black/55">
          {Math.round((score.correct / questions.length) * 100)}% correct · {score.answered} answered · {formatSeconds(seconds)} of {formatSeconds(limit)}
        </p>
        <p className="mt-2 text-[13px] text-black/70">
          {questions.length === realTest.questions ? "" : `Scaled to ${realTest.questions} questions: about ${scaled}. `}
          The average on the real CCAT is {realTest.averageScore} of {realTest.questions}.
        </p>
      </section>
      <section className="grid grid-cols-3 gap-2">
        {score.byCategory.map((category) => (
          <div key={category.id} className="rounded-xl bg-white/80 p-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <p className="text-[12px] text-black/55">{category.label}</p>
            <p className="text-lg font-semibold tabular-nums">
              {category.correct}/{category.total}
            </p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full bg-[#34c759]" style={{ width: `${category.total ? (category.correct / category.total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </section>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={onlyMissed} onChange={(event) => setOnlyMissed(event.target.checked)} />
          Only show mistakes
        </label>
        <button type="button" onClick={onRestart} className="rounded-lg bg-[#0a84ff] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#0071e3]">
          New test
        </button>
      </div>
      {shown.map(({ question, index, answer }) => {
        const state = status(question, answer);
        return (
          <article key={question.id} className="space-y-3 rounded-2xl bg-white/60 p-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <div className="flex items-baseline justify-between gap-2 text-[12px]">
              <span className="text-black/45">
                {index + 1}. {question.kind}
              </span>
              <span className={`font-semibold ${state.tone}`}>{state.label}</span>
            </div>
            <CcatQuestion question={question} choice={answer ?? null} review />
            <p className="text-[13px] text-black/70">
              {typeof answer === "number" && answer !== question.answer && <>You chose {answerText(question, answer)}. </>}
              Correct: {answerText(question, question.answer)}. {question.explanation}
            </p>
          </article>
        );
      })}
      {!shown.length && <p className="text-center text-[13px] text-black/50">No mistakes. Well done.</p>}
    </div>
  );
}
