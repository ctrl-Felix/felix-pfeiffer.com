export type ContactRole = "registrant" | "administrative" | "technical" | "billing" | "abuse" | "reseller" | "other";

export type Contact = {
  role: ContactRole;
  name: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  redacted: boolean;
};

export type RegistrarInfo = {
  name: string | null;
  ianaId: string | null;
  url: string | null;
  whoisServer: string | null;
  abuseEmail: string | null;
  abusePhone: string | null;
};

export type NameserverInfo = { host: string; ips: string[] };

export type DsRecord = {
  keyTag: number | null;
  algorithm: number | null;
  algorithmName: string | null;
  digestType: number | null;
  digestTypeName: string | null;
  digest: string | null;
};

export type StatusSeverity = "good" | "lock" | "pending" | "warning" | "danger" | "info";

export type StatusInfo = { code: string; label: string; explanation: string | null; severity: StatusSeverity };

export type Notice = { title: string | null; text: string };

export type WhoisResult = {
  domain: string;
  unicodeName: string | null;
  source: "rdap" | "whois";
  server: string | null;
  registered: boolean;
  registrar: string | null;
  registrarInfo: RegistrarInfo;
  handle: string | null;
  created: string | null;
  updated: string | null;
  expires: string | null;
  registryUpdated: string | null;
  transferred: string | null;
  status: string[];
  statusInfo: StatusInfo[];
  nameservers: string[];
  nameserverInfo: NameserverInfo[];
  dnssec: boolean | null;
  dsRecords: DsRecord[];
  contacts: Contact[];
  redacted: boolean;
  notices: Notice[];
  raw: string;
};

export const emptyRegistrar: RegistrarInfo = { name: null, ianaId: null, url: null, whoisServer: null, abuseEmail: null, abusePhone: null };

export function emptyResult(domain: string, source: "rdap" | "whois", registered: boolean): WhoisResult {
  return {
    domain,
    unicodeName: null,
    source,
    server: null,
    registered,
    registrar: null,
    registrarInfo: { ...emptyRegistrar },
    handle: null,
    created: null,
    updated: null,
    expires: null,
    registryUpdated: null,
    transferred: null,
    status: [],
    statusInfo: [],
    nameservers: [],
    nameserverInfo: [],
    dnssec: null,
    dsRecords: [],
    contacts: [],
    redacted: false,
    notices: [],
    raw: "",
  };
}
