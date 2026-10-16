"use client";

import { useState } from "react";
import { useCopy } from "@/components/useCopy";
import { site } from "@/config";
import type { WhoisResult } from "@/lib/whoisTypes";
import LookupTool from "./LookupTool";
import TldCoverage from "./TldCoverage";
import type { ToolProps } from "./toolNavigation";
import { ToolAbout } from "./ui";
import WhoisResultView from "./WhoisResultView";

const mcpUrl = `${site.url}/mcp`;

function CopyLine({ value }: { value: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/6 px-3 py-2">
      <code className="min-w-0 flex-1 break-all text-xs">{value}</code>
      <button type="button" onClick={() => copy(value)} className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-medium shadow-sm">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function About() {
  return (
    <ToolAbout toolId="whois">
      <section className="rounded-xl bg-white/80 p-4 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
        <h2 className="text-sm font-semibold">Use it from an AI assistant</h2>
        <p className="mt-1 text-xs text-black/55">
          Open MCP server, no account or key needed.{" "}
          <a href="/mcp" className="text-[#0a6cf0] hover:underline">How to connect</a>
        </p>
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium">Claude: Settings, Connectors, Add custom connector, then paste</p>
          <CopyLine value={mcpUrl} />
          <p className="text-xs font-medium">Claude Code</p>
          <CopyLine value={`claude mcp add --transport http security ${mcpUrl}`} />
        </div>
      </section>
    </ToolAbout>
  );
}

export default function WhoisTool(props: ToolProps) {
  const [showCoverage, setShowCoverage] = useState(false);
  const coverageButton = (
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
  );

  return (
    <LookupTool<WhoisResult>
      {...props}
      endpoint="/api/tools/whois?domain="
      placeholder="example.com"
      label="Domain name"
      maxLength={300}
      inputAddon={coverageButton}
      replacement={showCoverage ? <TldCoverage /> : undefined}
      idle={<About />}
      result={(result) => <WhoisResultView result={result} />}
    />
  );
}
