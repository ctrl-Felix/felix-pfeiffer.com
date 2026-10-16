"use client";

import { useCopy } from "@/components/useCopy";

export default function CopyButton({ value, className = "" }: { value: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button type="button" onClick={() => copy(value)} className={`shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium hover:bg-white/25 ${className}`}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
