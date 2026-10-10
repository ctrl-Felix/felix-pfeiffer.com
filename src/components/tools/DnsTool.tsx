"use client";

import { useState } from "react";
import { peekPendingLaunch } from "@/components/deepLink";
import { classifyTxt, formatDuration, hostmasterToEmail } from "@/lib/dnsFormat";
import type { DnsRecords, DnsResult, RecordType } from "@/lib/dnsLookup";
import { findToolInfo } from "@/data/tools";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: DnsResult };

const card = "overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]";
const order: RecordType[] = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA"];
const titles: Record<RecordType, string> = {
  A: "A · IPv4 addresses",
  AAAA: "AAAA · IPv6 addresses",
  CNAME: "CNAME · alias",
  MX: "MX · mail servers",
  NS: "NS · name servers",
  TXT: "TXT",
  SOA: "SOA · start of authority",
  CAA: "CAA · certificate authorities",
};

const Mono = ({ children }: { children: React.ReactNode }) => <span className="break-all font-mono text-xs">{children}</span>;

function Line({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2 text-[13px]">
      <span className="min-w-0">{left}</span>
      {right !== undefined && <span className="shrink-0 text-xs text-black/50">{right}</span>}
    </div>
  );
}

function Group({ type, children }: { type: RecordType; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-black/45">{titles[type]}</h3>
      <div className={`${card} divide-y divide-black/10`}>{children}</div>
    </section>
  );
}

function RecordGroup({ type, records }: { type: RecordType; records: DnsRecords }) {
  if (type === "A" || type === "AAAA") {
    return <>{records[type]!.map((record) => <Line key={record.address} left={<Mono>{record.address}</Mono>} right={`TTL ${formatDuration(record.ttl)}`} />)}</>;
  }
  if (type === "MX") return <>{records.MX!.map((record) => <Line key={`${record.priority}-${record.exchange}`} left={<Mono>{record.exchange}</Mono>} right={`Priority ${record.priority}`} />)}</>;
  if (type === "TXT") {
    return (
      <>
        {records.TXT!.map((value, index) => {
          const kind = classifyTxt(value);
          return <Line key={index} left={<Mono>{value}</Mono>} right={kind && <span className="rounded-md bg-black/6 px-1.5 py-0.5">{kind}</span>} />;
        })}
      </>
    );
  }
  if (type === "SOA" && records.SOA) {
    const soa = records.SOA;
    return (
      <>
        <Line left="Primary name server" right={<Mono>{soa.primaryNameserver}</Mono>} />
        <Line left="Contact" right={<Mono>{hostmasterToEmail(soa.hostmaster)}</Mono>} />
        <Line left="Serial" right={soa.serial} />
        <Line left="Refresh, retry, expire" right={`${formatDuration(soa.refresh)}, ${formatDuration(soa.retry)}, ${formatDuration(soa.expire)}`} />
        <Line left="Negative caching" right={formatDuration(soa.minimumTtl)} />
      </>
    );
  }
  if (type === "CAA") return <>{records.CAA!.map((record, index) => <Line key={index} left={<Mono>{record.tag} {record.value}</Mono>} right={record.critical ? "Critical" : undefined} />)}</>;
  return <>{(records[type] as string[]).map((value) => <Line key={value} left={<Mono>{value}</Mono>} />)}</>;
}

const hasRecords = (type: RecordType, records: DnsRecords) => {
  const value = records[type];
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
};

function Result({ result }: { result: DnsResult }) {
  const present = order.filter((type) => hasRecords(type, result.records));
  const absent = order.filter((type) => result.records[type] !== undefined && !hasRecords(type, result.records) && !result.failures[type]);
  const failed = order.filter((type) => result.failures[type]);

  return (
    <div className="space-y-4">
      <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
        <h2 className="min-w-0 truncate text-lg font-semibold">{result.domain}</h2>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${result.exists ? "bg-[#30b050]/15 text-[#1f7a35]" : "bg-[#ff9500]/15 text-[#a35f00]"}`}>
          {result.exists ? `${present.length} record ${present.length === 1 ? "type" : "types"}` : "Does not exist"}
        </span>
      </div>
      {present.map((type) => (
        <Group key={type} type={type}>
          <RecordGroup type={type} records={result.records} />
        </Group>
      ))}
      {result.exists && absent.length > 0 && <p className="px-1 text-xs text-black/45">No records: {absent.join(", ")}</p>}
      {failed.length > 0 && <p className="px-1 text-xs text-[#a35f00]">Could not be queried: {failed.join(", ")}</p>}
      <p className="text-center text-[11px] text-black/40">Answers from public resolvers, requested through this server. Lookups are not stored.</p>
    </div>
  );
}

function About() {
  const tool = findToolInfo("dns");
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

export default function DnsTool() {
  const [domain, setDomain] = useState(() => peekPendingLaunch()?.domain ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    if (!domain.trim()) return;
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/tools/dns?domain=${encodeURIComponent(domain.trim())}`);
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
          maxLength={253}
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
      {state.kind === "idle" && <About />}
    </div>
  );
}
