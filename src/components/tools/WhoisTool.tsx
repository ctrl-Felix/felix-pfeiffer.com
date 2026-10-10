"use client";

import { useState } from "react";
import { peekPendingLaunch } from "@/components/deepLink";
import type { WhoisResult } from "@/lib/whoisTypes";
import WhoisResultView from "./WhoisResultView";
import TldCoverage from "./TldCoverage";
import WhoisAbout from "./WhoisAbout";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: WhoisResult };

export default function WhoisTool() {
  const [domain, setDomain] = useState(() => peekPendingLaunch()?.domain ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [showCoverage, setShowCoverage] = useState(false);

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim()) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/tools/whois?domain=${encodeURIComponent(domain.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState({ kind: "done", result: data });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={lookup} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="example.com"
            aria-label="Domain name"
            autoFocus
            maxLength={300}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-lg bg-black/6 py-2 pl-3 pr-9 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]"
          />
          <button
            type="button"
            onClick={() => setShowCoverage((current) => !current)}
            aria-label="Supported top level domains"
            aria-pressed={showCoverage}
            title="Supported top level domains"
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#0a84ff] ${showCoverage ? "text-[#0a84ff]" : "text-black/30 hover:text-black/55"}`}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <circle cx="8" cy="8" r="6.4" />
              <path d="M8 7.2v3.6" strokeLinecap="round" />
              <circle cx="8" cy="5.1" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
        <button type="submit" disabled={!domain.trim() || state.kind === "loading"} className="rounded-lg bg-[#0a84ff] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40">
          Look up
        </button>
      </form>
      {showCoverage && <TldCoverage />}
      {!showCoverage && state.kind === "loading" && <p className="py-6 text-center text-sm text-black/45">Looking up…</p>}
      {!showCoverage && state.kind === "error" && <p className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[13px] text-[#c4281e]" role="alert">{state.message}</p>}
      {!showCoverage && state.kind === "done" && <WhoisResultView result={state.result} />}
      {!showCoverage && state.kind === "idle" && <WhoisAbout />}
    </div>
  );
}
