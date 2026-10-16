"use client";

import { classifyTxt, formatDuration, hostmasterToEmail } from "@/lib/dnsFormat";
import type { DnsRecords, DnsResult, RecordType } from "@/lib/dnsLookup";
import LookupTool from "./LookupTool";
import { ToolLink, type ToolProps } from "./toolNavigation";
import { ResultHeader, Section, ToolAbout } from "./ui";

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
const order = Object.keys(titles) as RecordType[];

const Mono = ({ children }: { children: React.ReactNode }) => <span className="break-all font-mono text-xs">{children}</span>;

function Line({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2 text-[13px]">
      <span className="min-w-0">{left}</span>
      {right !== undefined && <span className="shrink-0 text-xs text-black/50">{right}</span>}
    </div>
  );
}

function RecordGroup({ type, records }: { type: RecordType; records: DnsRecords }) {
  if (type === "A" || type === "AAAA") {
    return <>{records[type]!.map((record) => <Line key={record.address} left={<Mono><ToolLink toolId="ip" value={record.address}>{record.address}</ToolLink></Mono>} right={`TTL ${formatDuration(record.ttl)}`} />)}</>;
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
      <ResultHeader
        title={result.domain}
        badge={result.exists ? `${present.length} record ${present.length === 1 ? "type" : "types"}` : "Does not exist"}
        badgeClass={result.exists ? "bg-[#30b050]/15 text-[#1f7a35]" : "bg-[#ff9500]/15 text-[#a35f00]"}
      />
      {present.map((type) => (
        <Section key={type} title={titles[type]}>
          <RecordGroup type={type} records={result.records} />
        </Section>
      ))}
      {result.exists && absent.length > 0 && <p className="px-1 text-xs text-black/45">No records: {absent.join(", ")}</p>}
      {failed.length > 0 && <p className="px-1 text-xs text-[#a35f00]">Could not be queried: {failed.join(", ")}</p>}
      <p className="text-center text-[11px] text-black/40">Answers from public resolvers, requested through this server. Lookups are not stored.</p>
    </div>
  );
}

export default function DnsTool(props: ToolProps) {
  return (
    <LookupTool<DnsResult>
      {...props}
      endpoint="/api/tools/dns?domain="
      placeholder="example.com"
      label="Domain name"
      maxLength={253}
      idle={<ToolAbout toolId="dns" />}
      result={(result) => <Result result={result} />}
    />
  );
}
