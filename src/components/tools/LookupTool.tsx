"use client";

import { useEffect, useRef, useState } from "react";
import { peekPendingLaunch } from "@/components/deepLink";
import type { ToolProps } from "./toolNavigation";

type State<T> = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "done"; result: T };

type LookupToolProps<T> = ToolProps & {
  endpoint: string;
  placeholder: string;
  label: string;
  maxLength: number;
  action?: string;
  inputAddon?: React.ReactNode;
  replacement?: React.ReactNode;
  progress?: React.ReactNode;
  idle: React.ReactNode;
  result: (result: T) => React.ReactNode;
};

export default function LookupTool<T>(props: LookupToolProps<T>) {
  const { endpoint, placeholder, label, maxLength, action = "Look up", inputAddon, replacement, progress, idle, result, initialValue, autoRun } = props;
  const [value, setValue] = useState(() => initialValue ?? peekPendingLaunch()?.domain ?? "");
  const [state, setState] = useState<State<T>>({ kind: "idle" });
  const autoRan = useRef(false);

  async function lookup(input: string) {
    const query = input.trim();
    if (!query) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`${endpoint}${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState({ kind: "done", result: data });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  useEffect(() => {
    if (!autoRun || !initialValue || autoRan.current) return;
    autoRan.current = true;
    lookup(initialValue);
  });

  return (
    <div className="space-y-4">
      <form onSubmit={(event) => { event.preventDefault(); lookup(value); }} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            aria-label={label}
            autoFocus
            maxLength={maxLength}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full rounded-lg bg-black/6 py-2 pl-3 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff] ${inputAddon ? "pr-9" : "pr-3"}`}
          />
          {inputAddon}
        </div>
        <button type="submit" disabled={!value.trim() || state.kind === "loading"} className="rounded-lg bg-[#0a84ff] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40">
          {action}
        </button>
      </form>
      {replacement ?? (
        <>
          {state.kind === "loading" && (progress ?? <p className="py-6 text-center text-sm text-black/45">Looking up…</p>)}
          {state.kind === "error" && <p className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[13px] text-[#c4281e]" role="alert">{state.message}</p>}
          {state.kind === "done" && result(state.result)}
          {state.kind === "idle" && idle}
        </>
      )}
    </div>
  );
}
