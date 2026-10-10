"use client";

import { useState } from "react";
import { peekPendingLaunch } from "@/components/deepLink";
import type { WhoisResult } from "@/lib/whois";
import WhoisAbout from "./WhoisAbout";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: WhoisResult };

const dateFormat: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const time = Date.parse(iso);
  return Number.isNaN(time) ? iso : new Date(time).toLocaleDateString("en-US", dateFormat);
}

function relative(iso: string | null) {
  const time = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(time)) return "";
  const days = Math.round((time - Date.now()) / 86_400_000);
  if (days === 0) return " (today)";
  return days > 0 ? ` (in ${days} days)` : ` (${-days} days ago)`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 text-[13px]">
      <span className="shrink-0 font-medium">{label}</span>
      <span className="min-w-0 break-words text-right text-black/60">{children}</span>
    </div>
  );
}

function Result({ result }: { result: WhoisResult }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
        <h2 className="min-w-0 truncate text-lg font-semibold">{result.domain}</h2>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${result.registered ? "bg-[#30b050]/15 text-[#1f7a35]" : "bg-[#ff9500]/15 text-[#a35f00]"}`}>
          {result.registered ? "Registered" : "Not registered"}
        </span>
      </div>
      {result.registered && (
        <>
          <div className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <Row label="Registrar">{result.registrar ?? "—"}</Row>
            <Row label="Created">{formatDate(result.created)}</Row>
            <Row label="Updated">{formatDate(result.updated)}</Row>
            <Row label="Expires">
              {formatDate(result.expires)}
              {relative(result.expires)}
            </Row>
            <Row label="DNSSEC">{result.dnssec === null ? "—" : result.dnssec ? "Signed" : "Unsigned"}</Row>
          </div>
          <div className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <Row label="Status">
              {result.status.length ? (
                <span className="flex flex-wrap justify-end gap-1">
                  {result.status.map((status) => (
                    <span key={status} className="rounded-md bg-black/6 px-1.5 py-0.5 text-xs">{status}</span>
                  ))}
                </span>
              ) : (
                "—"
              )}
            </Row>
            <Row label="Name servers">
              {result.nameservers.length ? result.nameservers.map((server) => <span key={server} className="block">{server}</span>) : "—"}
            </Row>
          </div>
          <details className="rounded-xl bg-white/80 px-4 py-2.5 text-[13px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <summary className="cursor-default font-medium">Raw data</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-black/65">{result.raw}</pre>
          </details>
        </>
      )}
      <p className="text-center text-[11px] text-black/40">
        Source: {result.source === "rdap" ? "RDAP (registry)" : "WHOIS (port 43)"}, requested through this server. Lookups are not stored.
      </p>
    </div>
  );
}

export default function WhoisTool() {
  const [domain, setDomain] = useState(() => peekPendingLaunch()?.domain ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim()) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/tools/whois?domain=${encodeURIComponent(domain.trim())}`);
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
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="example.com"
          aria-label="Domain name"
          autoFocus
          maxLength={300}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg bg-black/6 px-3 py-2 text-[13px] outline-none placeholder:text-black/35 focus:ring-2 focus:ring-[#0a84ff]"
        />
        <button type="submit" disabled={!domain.trim() || state.kind === "loading"} className="rounded-lg bg-[#0a84ff] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40">
          Look up
        </button>
      </form>
      {state.kind === "loading" && <p className="py-6 text-center text-sm text-black/45">Looking up…</p>}
      {state.kind === "error" && <p className="rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[13px] text-[#c4281e]" role="alert">{state.message}</p>}
      {state.kind === "done" && <Result result={state.result} />}
      {state.kind === "idle" && <WhoisAbout />}
    </div>
  );
}
