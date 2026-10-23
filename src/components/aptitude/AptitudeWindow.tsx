"use client";

import { useState } from "react";
import CaseTest from "@/components/caseTest/CaseTest";
import CcatTest from "@/components/ccat/CcatTest";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";

const tests = [
  { id: "ccat", title: "CCAT", subtitle: "50 questions in 15 minutes: verbal, math and logic, and spatial reasoning.", color: "#0a84ff", mark: "C" },
  { id: "case", title: "Numerical and reasoning", subtitle: "A simulated first week on a client team: data, emails and reports. Untimed, but your time counts.", color: "#34c759", mark: "N" },
] as const;

type TestId = (typeof tests)[number]["id"];

function Home({ onPick }: { onPick: (id: TestId) => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="pb-5 pt-2 text-center">
        <h2 className="text-2xl font-semibold">Aptitude Practice</h2>
        <p className="mt-1 text-sm text-black/55">Practice tests for graduate and job applications.</p>
      </div>
      <div className="mx-auto max-w-md space-y-3">
        {tests.map((test) => (
          <button
            key={test.id}
            type="button"
            onClick={() => onPick(test.id)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white/80 p-3 text-left shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-semibold text-white" style={{ background: test.color }}>
              {test.mark}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{test.title}</span>
              <span className="block text-xs text-black/55">{test.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AptitudeWindow() {
  const { dragProps } = useWindow();
  const [test, setTest] = useState<TestId | null>(null);
  const exit = () => setTest(null);

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7]/95 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Aptitude Practice</h1>
      </div>
      {test === null && <Home onPick={setTest} />}
      {test === "ccat" && <CcatTest onExit={exit} />}
      {test === "case" && <CaseTest onExit={exit} />}
    </div>
  );
}
