"use client";

import { useState } from "react";
import { peekPendingLaunch } from "@/components/deepLink";
import { findToolInfo } from "@/data/tools";
import type { Subdomain, SubdomainResult } from "@/lib/subdomains";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: SubdomainResult };

const card = "overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]";
const field = "rounded-lg bg-black/6 px-3 py-2 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]";
const renderLimit = 1000;

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "unknown");

const pill = "ml-2 rounded-md bg-black/6 px-1.5 py-0.5 text-[11px] text-black/60";

const certificateNotes: Partial<Record<SubdomainResult["certificateSearch"], string>> = {
  incomplete: "This domain has more certificates than one search covers, so the list is incomplete.",
  unexpired: "This domain has too many certificates, so only names with a valid certificate are listed.",
  "too-many": "This domain has too many certificates to search, so only common names found in DNS are listed.",
  failed: "The certificate logs did not answer, so only common names found in DNS are listed. Try again later for the full list.",
};

function Row({ item }: { item: Subdomain }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2 text-[13px]">
      <span className="min-w-0">
        <span className="break-all font-mono text-xs">{item.name}</span>
        {item.wildcard && <span className={pill}>Wildcard</span>}
        {item.foundInDns && <span className={pill}>DNS</span>}
        <span className="mt-0.5 block text-[11px] text-black/45">
          {item.certificates ? `First seen ${day(item.firstSeen)} · ${item.certificates} ${item.certificates === 1 ? "certificate" : "certificates"}` : "Found in DNS, no certificate logged"}
        </span>
      </span>
      {item.certificates > 0 && (
        <span className={`shrink-0 text-xs ${item.current ? "text-[#1f7a35]" : "text-black/45"}`}>
          {item.current ? "Valid until" : "Expired"} {day(item.lastExpires)}
        </span>
      )}
    </div>
  );
}

function Result({ result }: { result: SubdomainResult }) {
  const [filter, setFilter] = useState("");
  const [currentOnly, setCurrentOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const needle = filter.trim().toLowerCase();
  const active = (item: Subdomain) => item.current || item.foundInDns;
  const shown = result.subdomains.filter((item) => (!currentOnly || active(item)) && item.name.includes(needle));
  const activeCount = result.subdomains.filter(active).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shown.map((item) => item.name).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
        <h2 className="min-w-0 truncate text-lg font-semibold">{result.domain}</h2>
        <span className="shrink-0 rounded-full bg-[#7a3cf0]/12 px-2.5 py-0.5 text-xs font-medium text-[#5a24c4]">
          {result.subdomains.length} {result.subdomains.length === 1 ? "name" : "names"} · {activeCount} active
        </span>
      </div>
      {certificateNotes[result.certificateSearch] && <p className="px-1 text-xs text-[#a35f00]">{certificateNotes[result.certificateSearch]}</p>}
      {result.dnsCheck?.wildcardDns && <p className="px-1 text-xs text-black/50">This domain answers every name in DNS, so only common names with their own addresses are marked DNS.</p>}
      {result.truncated && <p className="px-1 text-xs text-[#a35f00]">Only the first {result.subdomains.length} names are listed. Search a more specific name for the rest.</p>}
      {result.subdomains.length === 0 ? (
        <p className="py-6 text-center text-sm text-black/45">No names under {result.domain} were found in the certificate logs or in DNS.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter" aria-label="Filter names" maxLength={253} spellCheck={false} className={`${field} min-w-0 flex-1`} />
            <label className="flex items-center gap-1.5 text-xs text-black/60">
              <input type="checkbox" checked={currentOnly} onChange={(event) => setCurrentOnly(event.target.checked)} />
              Active only
            </label>
            <button type="button" onClick={copy} disabled={!shown.length} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium shadow-sm disabled:opacity-40">
              {copied ? "Copied" : `Copy ${shown.length}`}
            </button>
          </div>
          <div className={`${card} divide-y divide-black/10`}>
            {shown.slice(0, renderLimit).map((item) => <Row key={item.name} item={item} />)}
            {!shown.length && <p className="px-4 py-3 text-[13px] text-black/45">No names match.</p>}
          </div>
          {shown.length > renderLimit && <p className="px-1 text-xs text-black/45">Showing {renderLimit} of {shown.length} names. Filter or copy to see all.</p>}
          {result.issuers.length > 0 && (
            <p className="px-1 text-xs text-black/50">
              Issued by {result.issuers.slice(0, 5).map((issuer) => `${issuer.name} (${issuer.certificates})`).join(", ")}
            </p>
          )}
        </>
      )}
      <p className="text-center text-[11px] text-black/40">From public certificate transparency logs via crt.sh and {result.dnsCheck?.checked ?? "about 100"} common names checked through public DNS resolvers. Searches are not stored.</p>
    </div>
  );
}

function About() {
  const tool = findToolInfo("subdomains");
  if (!tool) return null;
  return (
    <div className="space-y-4 pt-2">
      <p className="text-[13px] text-black/60">{tool.seo.paragraphs[1]}</p>
      <section>
        <h2 className="mb-2 text-sm font-semibold">Frequently asked questions</h2>
        <div className={`${card} divide-y divide-black/10`}>
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

export default function SubdomainTool() {
  const [domain, setDomain] = useState(() => peekPendingLaunch()?.domain ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim()) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/tools/subdomains?domain=${encodeURIComponent(domain.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState({ kind: "done", result: data });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={search} className="flex gap-2">
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
          className={`${field} min-w-0 flex-1`}
        />
        <button type="submit" disabled={!domain.trim() || state.kind === "loading"} className="rounded-lg bg-[#0a84ff] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40">
          Search
        </button>
      </form>
      {state.kind === "loading" && <p className="py-6 text-center text-sm text-black/45">Searching certificate logs… This can take up to a minute.</p>}
      {state.kind === "error" && <p className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[13px] text-[#c4281e]" role="alert">{state.message}</p>}
      {state.kind === "done" && <Result key={state.result.domain} result={state.result} />}
      {state.kind === "idle" && <About />}
    </div>
  );
}
