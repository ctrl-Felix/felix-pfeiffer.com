import { algorithmName, digestTypeName } from "./dnssecNames";
import { describeStatuses, normalizeStatusCode } from "./eppStatus";
import { parseWhoisDate } from "./whoisDates";
import { emptyResult, type Contact, type ContactRole, type DsRecord, type NameserverInfo, type WhoisResult } from "./whoisTypes";

type Pair = { key: string; value: string; block: string[] };

const maxRawChars = 20_000;
const redactedPattern = /redacted|privacy|withheld|not disclosed|data protected|gdpr|non-public|protected/i;

export const notFoundPattern =
  /no match|not found|no entries found|no data found|no object found|object does not exist|status:\s*(free|available)|is available|available for registration|not registered|is free|nothing found|no records? (found|matching)|domain not exist/i;

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_\-.\s]+/g, " ").trim();

function readPairs(text: string): Pair[] {
  const pairs: Pair[] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim() || /^\s*(%|#|>>>|;|-{3,}|={3,})/.test(line)) continue;
    const bracket = line.match(/^\s*\[([^\]]{2,60})\]\s*(.*)$/);
    const colon = line.match(/^\s*([A-Za-z][A-Za-z0-9 _./()'-]{1,60}?)\s*:\s*(.*)$/);
    const match = bracket ?? colon;
    if (!match || /^(https?|ftp)$/i.test(match[1].trim())) continue;
    const block: string[] = [];
    if (!match[2].trim()) {
      for (let next = index + 1; next < lines.length && /^\s+\S/.test(lines[next]); next++) block.push(lines[next].trim());
    }
    pairs.push({ key: normalizeKey(match[1]), value: match[2].trim(), block });
  }
  return pairs;
}

function first(pairs: Pair[], aliases: string[]) {
  for (const alias of aliases) {
    const found = pairs.find((pair) => pair.key === alias && (pair.value || pair.block.length));
    if (found) return found.value || found.block[0];
  }
  return null;
}

function all(pairs: Pair[], aliases: string[]) {
  const values: string[] = [];
  for (const pair of pairs) {
    if (!aliases.includes(pair.key)) continue;
    if (pair.value) values.push(pair.value);
    values.push(...pair.block);
  }
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const date = (pairs: Pair[], aliases: string[]) => {
  for (const alias of aliases) {
    for (const pair of pairs.filter((candidate) => candidate.key === alias)) {
      const parsed = parseWhoisDate(pair.value || pair.block[0] || null);
      if (parsed) return parsed;
    }
  }
  return null;
};

const hostPattern = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/i;
const ipPattern = /^([0-9]{1,3}(\.[0-9]{1,3}){3}|[0-9a-f:]{3,39})$/i;

function readNameservers(pairs: Pair[]): NameserverInfo[] {
  const aliases = ["name server", "nserver", "name servers", "nameserver", "nameservers", "name server host", "dns", "host name"];
  const found = new Map<string, Set<string>>();
  for (const value of all(pairs, aliases)) {
    const [host, ...rest] = value.replace(/^\[.*?\]\s*/, "").split(/[\s,]+/);
    const lower = host?.replace(/\.$/, "").toLowerCase();
    if (!lower || !lower.includes(".") || !hostPattern.test(lower) || ipPattern.test(lower)) continue;
    const ips = found.get(lower) ?? new Set<string>();
    for (const extra of rest) if (ipPattern.test(extra) && extra.includes(extra.includes(":") ? ":" : ".")) ips.add(extra);
    found.set(lower, ips);
  }
  return [...found].map(([host, ips]) => ({ host, ips: [...ips] }));
}

function readDnssec(pairs: Pair[]) {
  const value = first(pairs, ["dnssec", "dnssec status", "domain signed", "signed", "dnssec signed"])?.toLowerCase();
  if (!value) return null;
  if (/unsigned|inactive|^no\b|^n$|disabled|not signed/.test(value)) return false;
  if (/signed|active|^yes\b|^y$|enabled/.test(value)) return true;
  return null;
}

function readDs(pairs: Pair[]): DsRecord[] {
  return all(pairs, ["ds rdata", "ds record", "dnssec ds data", "ds key"])
    .map((value) => value.match(/^(\d+)\s+(\d+)\s+(\d+)\s+([0-9a-f]+)$/i))
    .flatMap((match) => {
      if (!match) return [];
      const [keyTag, algorithm, digestType] = [Number(match[1]), Number(match[2]), Number(match[3])];
      return [{ keyTag, algorithm, algorithmName: algorithmName(algorithm), digestType, digestTypeName: digestTypeName(digestType), digest: match[4].toUpperCase() }];
    });
}

const contactRoles: [ContactRole, string[]][] = [
  ["registrant", ["registrant", "holder", "owner"]],
  ["administrative", ["admin", "administrative", "admin c"]],
  ["technical", ["tech", "technical", "tech c"]],
  ["billing", ["billing"]],
];

function readContacts(pairs: Pair[]): Contact[] {
  const contacts: Contact[] = [];
  for (const [role, prefixes] of contactRoles) {
    for (const prefix of prefixes) {
      const field = (suffixes: string[]) => first(pairs, suffixes.map((suffix) => `${prefix} ${suffix}`));
      const raw = {
        name: field(["name", "contact name"]),
        organization: field(["organization", "organisation", "org"]),
        email: field(["email", "e mail"]),
        phone: field(["phone", "telephone"]),
        country: field(["country", "country code"]),
      };
      const values = Object.values(raw).filter((value): value is string => Boolean(value));
      if (!values.length) continue;
      const redacted = values.some((value) => redactedPattern.test(value));
      const clean = (value: string | null) => (value && !redactedPattern.test(value) ? value : null);
      const contact: Contact = { role, name: clean(raw.name), organization: clean(raw.organization), email: clean(raw.email), phone: clean(raw.phone), country: raw.country && raw.country.length <= 3 ? raw.country : clean(raw.country), redacted };
      if (!contacts.some((existing) => existing.role === role)) contacts.push(contact);
    }
  }
  return contacts;
}

function readRegistrarName(pairs: Pair[]) {
  const pair = pairs.find((candidate) => ["registrar", "sponsoring registrar", "registrar name", "registrar organization", "registrar organisation"].includes(candidate.key) && (candidate.value || candidate.block.length));
  const value = pair ? pair.value || pair.block[0] : null;
  return value ? value.replace(/\s*\[.*?\]\s*$/, "").trim() || null : null;
}

export function parseWhoisText(text: string, domain: string, server: string | null = null): WhoisResult {
  const pairs = readPairs(text);
  const result = emptyResult(domain, "whois", true);
  result.server = server;
  result.registrar = readRegistrarName(pairs);
  result.registrarInfo = {
    name: result.registrar,
    ianaId: first(pairs, ["registrar iana id"]),
    url: first(pairs, ["registrar url", "registrar web", "registrar website"]),
    whoisServer: first(pairs, ["registrar whois server", "whois server"]),
    abuseEmail: first(pairs, ["registrar abuse contact email", "abuse contact email", "abuse email"]),
    abusePhone: first(pairs, ["registrar abuse contact phone", "abuse contact phone"]),
  };
  result.handle = first(pairs, ["registry domain id", "domain id", "roid"]);
  result.created = date(pairs, ["creation date", "created", "created on", "created date", "registered on", "registered", "registration date", "registration time", "registered date", "domain registration date", "domain name commencement date", "activation date"]);
  result.updated = date(pairs, ["updated date", "last updated", "last updated date", "last updated on", "last modified", "last update", "changed", "modified", "update date", "last transferred date"]);
  result.expires = date(pairs, ["registry expiry date", "registrar registration expiration date", "expiry date", "expiration date", "expiration time", "expires", "expires on", "expire date", "paid till", "renewal date", "validity date", "registry expiration date"]);
  result.registryUpdated = date(pairs, ["last update of whois database", "last update of rdap database"]);
  result.transferred = date(pairs, ["transfer date", "last transferred"]);
  result.status = [...new Set(all(pairs, ["domain status", "status", "state", "domain state", "eppstatus"]).map(normalizeStatusCode).filter(Boolean))];
  result.statusInfo = describeStatuses(result.status);
  result.nameserverInfo = readNameservers(pairs);
  result.nameservers = result.nameserverInfo.map((entry) => entry.host);
  result.dnssec = readDnssec(pairs);
  result.dsRecords = readDs(pairs);
  result.contacts = readContacts(pairs);
  result.redacted = result.contacts.some((contact) => contact.redacted) || /redacted for privacy|data redacted|gdpr/i.test(text);
  result.raw = text.slice(0, maxRawChars);
  return result;
}

export const hasUsefulData = (result: WhoisResult) =>
  Boolean(result.created || result.expires || result.nameservers.length || result.status.length || result.registrar);
