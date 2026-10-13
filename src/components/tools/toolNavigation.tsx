"use client";

import { createContext, useContext, useEffect, useRef } from "react";

export type ToolProps = { initialValue?: string; autoRun?: boolean };

type ToolNavigation = { openTool: (toolId: string, value: string) => void };

export const ToolNavigationContext = createContext<ToolNavigation>({ openTool: () => {} });

export const useToolNavigation = () => useContext(ToolNavigationContext);

export function useAutoRun(autoRun: boolean | undefined, initialValue: string | undefined, run: (value: string) => void) {
  const started = useRef(false);
  useEffect(() => {
    if (!autoRun || !initialValue || started.current) return;
    started.current = true;
    run(initialValue);
  });
}

export function ToolLink({ toolId, value, children }: { toolId: string; value: string; children: React.ReactNode }) {
  const { openTool } = useToolNavigation();
  return (
    <button type="button" onClick={() => openTool(toolId, value)} className="break-all text-left text-[#0a6cf0] hover:underline">
      {children}
    </button>
  );
}
