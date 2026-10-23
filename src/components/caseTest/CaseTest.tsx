"use client";

import { useState } from "react";
import BackButton from "@/components/aptitude/BackButton";
import { buildCaseTest, caseModes, setsPerSection, type CaseAnswer, type CaseQuestion } from "@/lib/caseTest";
import CaseResults from "./CaseResults";
import CaseRunner from "./CaseRunner";

type Phase = { name: "setup" } | { name: "running"; questions: CaseQuestion[] } | { name: "done"; questions: CaseQuestion[]; answers: CaseAnswer[]; seconds: number[] };

const rules = [
  "A simulated first week on a client team, with data, emails and reports.",
  "Numerical: tables and charts. Pick an answer, type a number or put items in order. A calculator is allowed.",
  "Reasoning: true, false or cannot say, assumptions, arguments, word choice and ranking statements.",
  "No time limit, but your time per question is recorded. Accuracy first, then speed.",
];

function Setup({ onStart, onExit }: { onStart: (mode: (typeof caseModes)[number]) => void; onExit: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <BackButton onClick={onExit} />
      <div className="pb-4 pt-2 text-center">
        <h2 className="text-2xl font-semibold">Numerical and reasoning</h2>
        <p className="mt-1 text-sm text-black/55">Practice for immersive graduate assessments.</p>
      </div>
      <ul className="mx-auto max-w-md list-disc space-y-1 pl-5 text-[13px] text-black/70">
        {rules.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ul>
      <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">
        {caseModes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onStart(mode)}
            className="rounded-2xl bg-white/80 px-2 py-3 text-center shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
          >
            <span className="block text-[15px] font-semibold">{mode.label}</span>
            <span className="mt-1 block text-[12px] text-black/55">{mode.sections.length * setsPerSection * 4} questions</span>
          </button>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-md text-center text-[12px] text-black/45">Questions are written for practice in the style of these assessments and are not taken from a real test.</p>
    </div>
  );
}

export default function CaseTest({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>({ name: "setup" });

  if (phase.name === "setup") return <Setup onExit={onExit} onStart={(mode) => setPhase({ name: "running", questions: buildCaseTest(mode.sections) })} />;
  if (phase.name === "running") {
    return <CaseRunner questions={phase.questions} onFinish={(answers, seconds) => setPhase({ name: "done", questions: phase.questions, answers, seconds })} />;
  }
  return <CaseResults questions={phase.questions} answers={phase.answers} seconds={phase.seconds} onRestart={() => setPhase({ name: "setup" })} />;
}
