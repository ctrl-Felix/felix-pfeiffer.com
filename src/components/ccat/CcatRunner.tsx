"use client";

import { useEffect, useRef, useState } from "react";
import { formatSeconds, secondsPerQuestion, type Answer, type PoolQuestion } from "@/lib/ccat";
import CcatQuestion from "./CcatQuestion";

const keys = "abcde";

type Props = {
  questions: PoolQuestion[];
  onFinish: (answers: Answer[], seconds: number) => void;
};

export default function CcatRunner({ questions, onFinish }: Props) {
  const limit = questions.length * secondsPerQuestion;
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [left, setLeft] = useState(limit);
  const answers = useRef<Answer[]>([]);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const finish = useRef(onFinish);

  useEffect(() => {
    finish.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    startedAt.current = Date.now();
    panel.current?.focus();
    const timer = setInterval(() => {
      const remaining = limit - (Date.now() - startedAt.current) / 1000;
      setLeft(Math.max(0, remaining));
      if (remaining > 0 || finished.current) return;
      finished.current = true;
      clearInterval(timer);
      finish.current(answers.current, limit);
    }, 250);
    return () => clearInterval(timer);
  }, [limit]);

  const question = questions[index];

  const submit = () => {
    if (finished.current) return;
    answers.current = [...answers.current, choice];
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setChoice(null);
      return;
    }
    finished.current = true;
    finish.current(answers.current, Math.min(limit, (Date.now() - startedAt.current) / 1000));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const picked = keys.indexOf(key) >= 0 ? keys.indexOf(key) : Number(key) - 1;
    if (event.key === "Enter") submit();
    else if (Number.isInteger(picked) && picked >= 0 && picked < question.options.length) setChoice(picked);
  };

  return (
    <div ref={panel} tabIndex={-1} onKeyDown={onKeyDown} className="flex min-h-0 flex-1 flex-col outline-none">
      <div className="shrink-0 border-b border-black/10 px-4 py-2">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-black/55">
            Question {index + 1} of {questions.length}
          </span>
          <span className={`font-semibold tabular-nums ${left < 60 ? "text-[#ff3b30]" : ""}`} role="timer" aria-label="Time left">
            {formatSeconds(left)}
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <CcatQuestion key={question.id} question={question} choice={choice} onChoose={setChoice} />
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/10 px-4 py-3">
        <span className="text-[12px] text-black/40">No way back. A guess beats a skip.</span>
        <button type="button" onClick={submit} className="rounded-lg bg-[#0a84ff] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#0071e3]">
          {choice === null ? "Skip" : index + 1 < questions.length ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
}
