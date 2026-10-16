"use client";

import { useState } from "react";
import { useCopy } from "@/components/useCopy";
import { findToolInfo } from "@/data/tools";
import type { Subdomain, SubdomainResult } from "@/lib/subdomains";
import LookupTool from "./LookupTool";
import SearchProgress, { type ProgressStep } from "./SearchProgress";
import { ToolLink, type ToolProps } from "./toolNavigation";
import { card, ResultHeader, ToolAbout } from "./ui";

const field = "rounded-lg bg-black/6 px-3 py-2 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]";
const renderLimit = 1000;
const progressSteps: ProgressStep[] = [
  { label: "Searching the certificate transparency logs", after: 0 },
  { label: "Checking common names like www, mail and api in DNS", after: 2 },
  { label: "Waiting for the certificate database", after: 8 },
  { label: "Asking the crt.sh website instead", after: 16 },
  { label: "Still collecting certificates, large domains take longer", after: 35 },
];

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
        <span className="break-all font-mono text-xs"><ToolLink toolId="dns" value={item.name}>{item.name}</ToolLink></span>
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
  const { copied, copy } = useCopy();
  const needle = filter.trim().toLowerCase();
  const active = (item: Subdomain) => item.current || item.foundInDns;
  const shown = result.subdomains.filter((item) => (!currentOnly || active(item)) && item.name.includes(needle));
  const activeCount = result.subdomains.filter(active).length;

  return (
    <div className="space-y-4">
      <ResultHeader
        title={result.domain}
        badge={`${result.subdomains.length} ${result.subdomains.length === 1 ? "name" : "names"} · ${activeCount} active`}
        badgeClass="bg-[#7a3cf0]/12 text-[#5a24c4]"
      />
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
            <button type="button" onClick={() => copy(shown.map((item) => item.name).join("\n"))} disabled={!shown.length} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium shadow-sm disabled:opacity-40">
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

export default function SubdomainTool(props: ToolProps) {
  return (
    <LookupTool<SubdomainResult>
      {...props}
      endpoint="/api/tools/subdomains?domain="
      placeholder="example.com"
      label="Domain name"
      maxLength={300}
      action="Search"
      progress={<SearchProgress steps={progressSteps} expectedSeconds={12} />}
      idle={<ToolAbout toolId="subdomains" intro={findToolInfo("subdomains")?.seo.paragraphs[1]} />}
      result={(result) => <Result key={result.domain} result={result} />}
    />
  );
}
