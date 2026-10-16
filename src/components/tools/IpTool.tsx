"use client";

import type { IpResult } from "@/lib/ipLookup";
import LookupTool from "./LookupTool";
import type { ToolProps } from "./toolNavigation";
import { ResultHeader, Section, ToolAbout } from "./ui";

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

const day = (iso: string | null) => iso?.slice(0, 10);

function Line({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2 text-[13px]">
      <span className="shrink-0 text-black/55">{label}</span>
      <span className={`min-w-0 break-words text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function Result({ result }: { result: IpResult }) {
  const { network, asn } = result;
  const country = network?.country ?? network?.organization?.country ?? asn?.country ?? null;
  return (
    <div className="space-y-4">
      <ResultHeader title={result.ip} badge={`IPv${result.version}`} badgeClass="bg-[#ff9500]/15 text-[#a35f00]" mono />
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

export default function IpTool(props: ToolProps) {
  return (
    <LookupTool<IpResult>
      {...props}
      endpoint="/api/tools/ip?ip="
      placeholder="1.1.1.1 or 2606:4700:4700::1111"
      label="IP address"
      maxLength={47}
      idle={<ToolAbout toolId="ip" />}
      result={(result) => <Result result={result} />}
    />
  );
}
