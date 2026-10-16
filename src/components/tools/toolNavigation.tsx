"use client";

import { createContext, useContext } from "react";

export type ToolProps = { initialValue?: string; autoRun?: boolean };

type ToolNavigation = { openTool: (toolId: string, value: string) => void };

export const ToolNavigationContext = createContext<ToolNavigation>({ openTool: () => {} });

export function ToolLink({ toolId, value, children }: { toolId: string; value: string; children: React.ReactNode }) {
  const { openTool } = useContext(ToolNavigationContext);
  return (
    <button type="button" onClick={() => openTool(toolId, value)} className="break-all text-left text-[#0a6cf0] hover:underline">
      {children}
    </button>
  );
}
