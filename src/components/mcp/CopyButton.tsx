"use client";

import { useState } from "react";

export default function CopyButton({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button type="button" onClick={copy} className={`shrink-0 rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium hover:bg-white/25 ${className}`}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
