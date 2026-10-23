"use client";

import { useEffect, useRef, useState } from "react";
import { formatSeconds } from "@/lib/ccat";
import { isAnswered, sections, type CaseAnswer as Answer, type CaseQuestion } from "@/lib/caseTest";
import CaseAnswer from "./CaseAnswer";
import CaseContext from "./CaseContext";

type Props = {
  questions: CaseQuestion[];
  onFinish: (answers: Answer[], seconds: number[]) => void;
};

export default function CaseRunner({ questions, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<Answer | undefined>(undefined);
  const [elapsed, setElapsed] = useState(0);
  const answers = useRef<Answer[]>([]);
  const seconds = useRef<number[]>([]);
  const startedAt = useRef(0);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    body.current?.scrollTo({ top: 0 });
    const timer = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 500);
    return () => clearInterval(timer);
  }, [index]);

  const question = questions[index];
  const section = sections.find((entry) => entry.id === question.set.section)?.label;
  const ready = isAnswered(question.item, value);

  const next = () => {
    if (!ready || value === undefined) return;
    answers.current = [...answers.current, value];
    seconds.current = [...seconds.current, (Date.now() - startedAt.current) / 1000];
    if (index + 1 === questions.length) {
      onFinish(answers.current, seconds.current);
      return;
    }
    setIndex(index + 1);
    setValue(undefined);
    setElapsed(0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-black/10 px-4 py-2">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-black/55">
            {section} · Question {index + 1} of {questions.length}
          </span>
          <span className="tabular-nums text-black/70" aria-label="Time on this question">
            {formatSeconds(elapsed)}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-[#34c759]" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
      </div>
      <div ref={body} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <CaseContext set={question.set} />
        <p className="text-[15px] font-medium leading-relaxed">{question.item.prompt}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            next();
          }}
        >
          <CaseAnswer key={question.key} item={question.item} value={value} onChange={setValue} />
        </form>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
        <span className="text-[12px] text-black/40">No time limit, but your time counts.</span>
        <button
          type="button"
          onClick={next}
          disabled={!ready}
          className="rounded-lg bg-[#34c759] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#2fb350] disabled:bg-black/15"
        >
          {index + 1 === questions.length ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
