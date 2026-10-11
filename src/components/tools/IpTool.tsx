"use client";

import { useState } from "react";
import { peekPendingLaunch } from "@/components/deepLink";
import { findToolInfo } from "@/data/tools";
import type { IpResult } from "@/lib/ipLookup";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: IpResult };

const card = "overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]";
const failedLabels: Record<IpResult["failed"][number], string> = { registry: "registry", routing: "ASN", reverseDns: "reverse DNS" };

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

const countryName = (code: string | null | undefined) => {
  if (!code) return null;
  try {
    const name = regionNames?.of(code);
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
};

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : null);

function Line({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2 text-[13px]">
      <span className="shrink-0 text-black/55">{label}</span>
      <span className={`min-w-0 break-words text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-black/45">{title}</h3>
      <div className={`${card} divide-y divide-black/10`}>{children}</div>
    </section>
  );
}

function Result({ result }: { result: IpResult }) {
  const { network, asn } = result;
  const country = network?.country ?? network?.organization?.country ?? asn?.country ?? null;
  return (
    <div className="space-y-4">
      <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
        <h2 className="min-w-0 break-all font-mono text-base font-semibold">{result.ip}</h2>
        <span className="shrink-0 rounded-full bg-[#ff9500]/15 px-2.5 py-0.5 text-xs font-medium text-[#a35f00]">IPv{result.version}</span>
      </div>
      <Section title="Owner">
        <Line label="Organization" value={network?.organization?.name ?? "Unknown"} />
        <Line label="Address" value={network?.organization?.address} />
        <Line label="Country" value={countryName(country) ?? "Unknown"} />
        <Line label="Abuse contact" value={network?.abuse && [network.abuse.email, network.abuse.phone].filter(Boolean).join(" · ")} mono />
      </Section>
      {network && (
        <Section title="Network">
          <Line label="Name" value={network.name} mono />
          <Line label="Range" value={network.range} mono />
          <Line label="CIDR" value={network.cidrs.join(", ")} mono />
          <Line label="Type" value={network.type} />
          <Line label="Handle" value={network.handle} mono />
          <Line label="Registry" value={network.registry ?? network.server} />
          <Line label="Registered" value={day(network.registered)} />
          <Line label="Last changed" value={day(network.updated)} />
        </Section>
      )}
      <Section title="Routing">
        {asn ? (
          <>
            <Line label="ASN" value={`AS${asn.asn}`} mono />
            <Line label="AS name" value={asn.name} />
            <Line label="BGP prefix" value={asn.prefix} mono />
            <Line label="Allocated" value={asn.allocated} />
          </>
        ) : (
          <Line label="ASN" value="Not announced" />
        )}
        <Line label="Reverse DNS" value={result.reverseDns.length ? result.reverseDns.join(", ") : "None"} mono />
      </Section>
      {network && network.remarks.length > 0 && (
        <Section title="Remarks">
          {network.remarks.map((remark) => (
            <p key={remark} className="px-4 py-2 text-xs text-black/60">{remark}</p>
          ))}
        </Section>
      )}
      {result.failed.length > 0 && <p className="px-1 text-xs text-[#a35f00]">Could not be queried: {result.failed.map((part) => failedLabels[part]).join(", ")}</p>}
      <p className="text-center text-[11px] text-black/40">Registry data via RDAP, ASN via Team Cymru, reverse DNS via public resolvers. The country is the registered one, not a geolocation. Lookups are not stored.</p>
    </div>
  );
}

function About() {
  const tool = findToolInfo("ip");
  if (!tool) return null;
  return (
    <div className="space-y-4 pt-2">
      <p className="text-[13px] text-black/60">{tool.description}</p>
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

export default function IpTool() {
  const [address, setAddress] = useState(() => peekPendingLaunch()?.domain ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (!address.trim()) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/tools/ip?ip=${encodeURIComponent(address.trim())}`);
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
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="1.1.1.1 or 2606:4700:4700::1111"
          aria-label="IP address"
          autoFocus
          maxLength={47}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg bg-black/6 px-3 py-2 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]"
        />
        <button type="submit" disabled={!address.trim() || state.kind === "loading"} className="rounded-lg bg-[#0a84ff] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40">
          Look up
        </button>
      </form>
      {state.kind === "loading" && <p className="py-6 text-center text-sm text-black/45">Looking up…</p>}
      {state.kind === "error" && <p className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[13px] text-[#c4281e]" role="alert">{state.message}</p>}
      {state.kind === "done" && <Result result={state.result} />}
      {state.kind === "idle" && <About />}
    </div>
  );
}
