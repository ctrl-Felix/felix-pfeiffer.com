"use client";

import { useState } from "react";
import { site } from "@/config";
import { findToolInfo } from "@/data/tools";

const mcpUrl = `${site.url}/mcp`;
const claudeCodeCommand = `claude mcp add --transport http security ${mcpUrl}`;

function CopyLine({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/6 px-3 py-2">
      <code className="min-w-0 flex-1 break-all text-xs">{value}</code>
      <button type="button" onClick={copy} className="shrink-0 rounded-md bg-white px-2 py-0.5 text-xs font-medium shadow-sm">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function WhoisAbout() {
  const tool = findToolInfo("whois");
  if (!tool) return null;

  return (
    <div className="space-y-4 pt-2">
      <p className="text-[13px] text-black/60">{tool.description}</p>
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
          <CopyLine value={claudeCodeCommand} />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold">Frequently asked questions</h2>
        <div className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
          {tool.seo.faq.map((item) => (
            <details key={item.question} className="px-4 py-2.5 text-[13px]">
              <summary className="cursor-default font-medium">{item.question}</summary>
              <p className="mt-1.5 text-black/60">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
