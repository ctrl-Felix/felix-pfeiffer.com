"use client";

import { useState } from "react";
import BackButton from "@/components/aptitude/BackButton";
import { buildTest, realTest, secondsPerQuestion, testLengths, type Answer, type PoolQuestion } from "@/lib/ccat";
import CcatResults from "./CcatResults";
import CcatRunner from "./CcatRunner";

type Phase = { name: "setup" } | { name: "running"; questions: PoolQuestion[] } | { name: "done"; questions: PoolQuestion[]; answers: Answer[]; seconds: number };

const rules = [
  `${secondsPerQuestion} seconds per question on average, one timer for the whole test.`,
  "Verbal, math and logic, and spatial questions, getting harder as you go.",
  "No calculator, and no going back to a question.",
  "Wrong answers cost nothing, so guess rather than skip.",
];

function Setup({ onStart, onExit }: { onStart: (length: number) => void; onExit: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <BackButton onClick={onExit} />
      <div className="pb-4 pt-2 text-center">
        <h2 className="text-2xl font-semibold">CCAT</h2>
        <p className="mt-1 text-sm text-black/55">Practice for the Criteria Cognitive Aptitude Test.</p>
      </div>
      <ul className="mx-auto max-w-md list-disc space-y-1 pl-5 text-[13px] text-black/70">
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">
        {testLengths.map((length) => (
          <button
            key={length}
            type="button"
            onClick={() => onStart(length)}
            className="rounded-2xl bg-white/80 px-2 py-3 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
          >
            <span className="block text-xl font-semibold">{length}</span>
            <span className="block text-[12px] text-black/55">questions</span>
            <span className="mt-1 block text-[12px] font-medium text-[#0a84ff]">{(length * secondsPerQuestion) / 60} min</span>
          </button>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-md text-center text-[12px] text-black/45">
        The real CCAT has {realTest.questions} questions in {realTest.minutes} minutes, and the average score is {realTest.averageScore}. These practice questions follow its format but are not taken from it.
      </p>
    </div>
  );
}

export default function CcatTest({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  if (phase.name === "setup") return <Setup onExit={onExit} onStart={(length) => setPhase({ name: "running", questions: buildTest(length) })} />;
  if (phase.name === "running") {
    return <CcatRunner questions={phase.questions} onFinish={(answers, seconds) => setPhase({ name: "done", questions: phase.questions, answers, seconds })} />;
  }
  return (
    <CcatResults
      questions={phase.questions}
      answers={phase.answers}
      seconds={phase.seconds}
      limit={phase.questions.length * secondsPerQuestion}
      onRestart={() => setPhase({ name: "setup" })}
    />
  );
}
