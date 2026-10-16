import { ageText, expiryText, expiryTone, formatDate, type ExpiryTone } from "@/lib/whoisFormat";
import type { Contact, WhoisResult } from "@/lib/whoisTypes";
import { card, Section } from "./ui";

const toneClass: Record<ExpiryTone, string> = {
  good: "text-[#1f7a35]",
  soon: "text-[#a35f00]",
  warning: "text-[#c4281e]",
  expired: "text-[#c4281e]",
  unknown: "text-black/60",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 text-[13px]">
      <span className="shrink-0 font-medium">{label}</span>
      <span className="min-w-0 break-words text-right text-black/60">{children}</span>
    </div>
  );
}

const Muted = ({ children }: { children: React.ReactNode }) => <span className="text-black/40">{children}</span>;

function DateRow({ label, iso, relative }: { label: string; iso: string | null; relative?: string | null }) {
  if (!iso) return null;
  return (
    <Row label={label}>
      {formatDate(iso)}
      {relative && <Muted> ({relative})</Muted>}
    </Row>
  );
}

function ContactRows({ contacts }: { contacts: Contact[] }) {
  return (
    <>
      {contacts.map((contact) => {
        const details = [contact.name, contact.organization, contact.email, contact.phone, contact.country].filter(Boolean);
        return (
          <Row key={`${contact.role}-${details.join("|")}`} label={contact.role[0].toUpperCase() + contact.role.slice(1)}>
            {details.length ? details.map((detail) => <span key={detail} className="block">{detail}</span>) : <Muted>Redacted</Muted>}
            {contact.redacted && details.length > 0 && <Muted>Partly redacted</Muted>}
          </Row>
        );
      })}
    </>
  );
}

export default function WhoisResultView({ result }: { result: WhoisResult }) {
  const tone = expiryTone(result.expires);
  const age = ageText(result.created);
  const expiry = expiryText(result.expires);
  const registrar = result.registrarInfo;
  const shownContacts = result.contacts.filter((contact) => contact.name || contact.organization || contact.email || contact.phone);

  return (
    <div className="space-y-4">
      <div className={`${card} px-4 py-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{result.domain}</h2>
            {result.unicodeName && result.unicodeName !== result.domain && <p className="truncate text-xs text-black/50">{result.unicodeName}</p>}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${result.registered ? "bg-[#30b050]/15 text-[#1f7a35]" : "bg-[#ff9500]/15 text-[#a35f00]"}`}>
            {result.registered ? "Registered" : "Not registered"}
          </span>
        </div>
        {result.registered && (age || expiry) && (
          <p className="mt-1 text-xs text-black/55">
            {age && <>Registered {age} ago</>}
            {age && expiry && " · "}
            {expiry && <span className={`font-medium ${toneClass[tone]}`}>{tone === "expired" ? `Expired ${expiry}` : `Expires ${expiry}`}</span>}
          </p>
        )}
      </div>

      {result.registered && (
        <>
          <Section title="Registration">
            <Row label="Registrar">
              {registrar.name ?? "—"}
              {registrar.ianaId && <Muted> · IANA {registrar.ianaId}</Muted>}
              {registrar.url && (
                <a href={registrar.url} target="_blank" rel="noopener noreferrer" className="block text-[#0a6cf0] hover:underline">
                  {registrar.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </Row>
            <DateRow label="Registered" iso={result.created} />
            <DateRow label="Last changed" iso={result.updated} />
            <DateRow label="Expires" iso={result.expires} relative={expiry} />
            <DateRow label="Transferred" iso={result.transferred} />
            {result.handle && <Row label="Registry ID"><span className="font-mono text-xs">{result.handle}</span></Row>}
          </Section>

          {result.statusInfo.length > 0 && (
            <Section title="Status">
              {result.statusInfo.map((status) => (
                <div key={status.code} className="px-4 py-2.5 text-[13px]">
                  <div className="break-all font-mono text-xs">{status.code}</div>
                  {status.explanation && <div className="mt-0.5 text-xs text-black/55">{status.explanation}</div>}
                </div>
              ))}
            </Section>
          )}

          <Section title="Name servers">
            {result.nameserverInfo.length ? (
              result.nameserverInfo.map((server) => (
                <div key={server.host} className="px-4 py-2 text-[13px]">
                  <div className="font-mono text-xs">{server.host}</div>
                  {server.ips.length > 0 && <div className="font-mono text-[11px] text-black/45">{server.ips.join(", ")}</div>}
                </div>
              ))
            ) : (
              <Row label="Name servers">—</Row>
            )}
          </Section>

          <Section title="DNSSEC">
            <Row label="Delegation">{result.dnssec === null ? "—" : result.dnssec ? "Signed" : "Unsigned"}</Row>
            {result.dsRecords.map((record) => (
              <div key={`${record.keyTag}-${record.digest}`} className="px-4 py-2 text-[13px]">
                <div className="text-xs font-medium">
                  Key tag {record.keyTag ?? "?"} · {record.algorithmName ?? "unknown algorithm"} · {record.digestTypeName ?? "unknown digest"}
                </div>
                {record.digest && <div className="break-all font-mono text-[11px] text-black/45">{record.digest}</div>}
              </div>
            ))}
          </Section>

          <Section title="Contacts">
            {registrar.abuseEmail && (
              <Row label="Registrar abuse">
                <a href={`mailto:${registrar.abuseEmail}`} className="text-[#0a6cf0] hover:underline">{registrar.abuseEmail}</a>
                {registrar.abusePhone && <span className="block">{registrar.abusePhone}</span>}
              </Row>
            )}
            <ContactRows contacts={shownContacts} />
            {result.redacted && <Row label="Registrant"><Muted>Personal data is redacted by the registry</Muted></Row>}
            {!registrar.abuseEmail && !shownContacts.length && !result.redacted && <Row label="Contacts">—</Row>}
          </Section>

          {result.notices.length > 0 && (
            <details className={`${card} px-4 py-2.5 text-[13px]`}>
              <summary className="cursor-default font-medium">Notices from the registry</summary>
              <div className="mt-2 space-y-2 text-xs text-black/60">
                {result.notices.map((notice, index) => (
                  <p key={index}>
                    {notice.title && <span className="font-medium text-black/75">{notice.title}: </span>}
                    {notice.text}
                  </p>
                ))}
              </div>
            </details>
          )}

          <details className={`${card} px-4 py-2.5 text-[13px]`}>
            <summary className="cursor-default font-medium">Raw data</summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-black/65">{result.raw}</pre>
          </details>
        </>
      )}
      <p className="text-center text-[11px] text-black/40">
        Source: {result.source === "rdap" ? "RDAP" : "WHOIS"}
        {result.server ? ` via ${result.server}` : ""}
        {result.registryUpdated ? `, registry data from ${formatDate(result.registryUpdated)}` : ""}. Lookups are not stored.
      </p>
    </div>
  );
}
