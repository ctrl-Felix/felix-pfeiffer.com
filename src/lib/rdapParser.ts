import { algorithmName, digestTypeName } from "./dnssecNames";
import { describeStatuses } from "./eppStatus";
import { emptyRegistrar, emptyResult, type Contact, type ContactRole, type DsRecord, type NameserverInfo, type Notice, type WhoisResult } from "./whoisTypes";

type Json = Record<string, unknown>;

const maxRawChars = 20_000;
const maxNotices = 6;
const maxNoticeChars = 600;
const redactedPattern = /redacted|privacy|withheld|not disclosed|data protected|gdpr/i;

const asArray = (value: unknown): Json[] => (Array.isArray(value) ? value.filter((item): item is Json => typeof item === "object" && item !== null) : []);
const asString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

function toIso(value: unknown) {
  const text = asString(value);
  if (!text) return null;
  const time = Date.parse(text);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

function eventDate(json: Json, ...actions: string[]) {
  const events = asArray(json.events);
  for (const action of actions) {
    const found = events.find((event) => event.eventAction === action);
    if (found) return toIso(found.eventDate);
  }
  return null;
}

type Card = { fn: string | null; org: string | null; email: string | null; tel: string | null; url: string | null; country: string | null };

function readCard(entity: Json): Card {
  const card: Card = { fn: null, org: null, email: null, tel: null, url: null, country: null };
  const properties = (entity.vcardArray as unknown[] | undefined)?.[1];
  if (!Array.isArray(properties)) return card;
  for (const property of properties) {
    if (!Array.isArray(property)) continue;
    const [name, , , value] = property as [string, unknown, unknown, unknown];
    if (name === "fn") card.fn ??= asString(value);
    else if (name === "org") card.org ??= asString(Array.isArray(value) ? value[0] : value);
    else if (name === "email") card.email ??= asString(value);
    else if (name === "tel") card.tel ??= asString(typeof value === "string" ? value.replace(/^tel:/i, "") : value);
    else if (name === "url") card.url ??= asString(value);
    else if (name === "adr") {
      const label = (property[1] as Json | undefined)?.cc;
      const parts = Array.isArray(value) ? value : [];
      card.country ??= asString(label) ?? asString(parts[6]);
    }
  }
  return card;
}

function flattenEntities(entities: Json[]): Json[] {
  return entities.flatMap((entity) => [entity, ...flattenEntities(asArray(entity.entities))]);
}

const roleMap: Record<string, ContactRole> = {
  registrant: "registrant",
  administrative: "administrative",
  technical: "technical",
  billing: "billing",
  abuse: "abuse",
  reseller: "reseller",
};

function entityRedacted(entity: Json, card: Card) {
  const status = Array.isArray(entity.status) ? entity.status.map(String) : [];
  if (status.some((value) => /removed|redacted/i.test(value))) return true;
  const remarks = asArray(entity.remarks).map((remark) => [remark.title, ...(Array.isArray(remark.description) ? remark.description : [])].join(" "));
  return [card.fn, card.org, card.email, ...remarks].some((value) => typeof value === "string" && redactedPattern.test(value));
}

function toContact(entity: Json, role: ContactRole): Contact {
  const card = readCard(entity);
  const redacted = entityRedacted(entity, card);
  const clean = (value: string | null) => (value && !redactedPattern.test(value) ? value : null);
  return {
    role,
    name: clean(card.fn),
    organization: clean(card.org),
    email: clean(card.email),
    phone: clean(card.tel),
    country: card.country,
    redacted,
  };
}

function hasData(contact: Contact) {
  return Boolean(contact.name || contact.organization || contact.email || contact.phone || contact.country);
}

function readRegistrar(entities: Json[], json: Json) {
  const registrar = entities.find((entity) => Array.isArray(entity.roles) && entity.roles.includes("registrar"));
  const info = { ...emptyRegistrar };
  if (registrar) {
    const card = readCard(registrar);
    info.name = card.fn ?? card.org;
    info.url = card.url ?? asString(asArray(registrar.links).find((link) => link.rel === "about")?.href);
    const publicId = asArray(registrar.publicIds).find((id) => /iana/i.test(String(id.type)));
    info.ianaId = asString(publicId?.identifier);
    info.whoisServer = asString(registrar.port43);
    const abuse = flattenEntities(asArray(registrar.entities)).find((entity) => Array.isArray(entity.roles) && entity.roles.includes("abuse"));
    if (abuse) {
      const abuseCard = readCard(abuse);
      info.abuseEmail = abuseCard.email;
      info.abusePhone = abuseCard.tel;
    }
  }
  info.url ??= asString(asArray(json.links).find((link) => link.rel === "related" && !/rdap/i.test(String(link.type)))?.href);
  return info;
}

function readNameservers(json: Json): NameserverInfo[] {
  return asArray(json.nameservers).flatMap((server) => {
    const host = asString(server.ldhName)?.toLowerCase();
    if (!host) return [];
    const addresses = (server.ipAddresses ?? {}) as { v4?: unknown; v6?: unknown };
    const ips = [...(Array.isArray(addresses.v4) ? addresses.v4 : []), ...(Array.isArray(addresses.v6) ? addresses.v6 : [])].filter((ip): ip is string => typeof ip === "string");
    return [{ host, ips }];
  });
}

function readDs(json: Json): DsRecord[] {
  const secureDns = (json.secureDNS ?? {}) as Json;
  const number = (value: unknown) => (typeof value === "number" ? value : null);
  return asArray(secureDns.dsData).map((record) => ({
    keyTag: number(record.keyTag),
    algorithm: number(record.algorithm),
    algorithmName: algorithmName(number(record.algorithm)),
    digestType: number(record.digestType),
    digestTypeName: digestTypeName(number(record.digestType)),
    digest: asString(record.digest)?.toUpperCase() ?? null,
  }));
}

function readNotices(json: Json): Notice[] {
  return [...asArray(json.notices), ...asArray(json.remarks)]
    .map((notice) => ({
      title: asString(notice.title),
      text: (Array.isArray(notice.description) ? notice.description.map(String).join(" ") : "").replace(/\s+/g, " ").trim().slice(0, maxNoticeChars),
    }))
    .filter((notice) => notice.text)
    .slice(0, maxNotices);
}

export function parseRdap(json: Json, domain: string, server: string | null = null): WhoisResult {
  const result = emptyResult(typeof json.ldhName === "string" ? json.ldhName.toLowerCase() : domain, "rdap", true);
  const entities = flattenEntities(asArray(json.entities));

  result.unicodeName = asString(json.unicodeName)?.toLowerCase() ?? null;
  result.server = server;
  result.handle = asString(json.handle);
  result.registrarInfo = readRegistrar(entities, json);
  result.registrar = result.registrarInfo.name;
  result.created = eventDate(json, "registration");
  result.updated = eventDate(json, "last changed");
  result.expires = eventDate(json, "expiration");
  result.registryUpdated = eventDate(json, "last update of RDAP database");
  result.transferred = eventDate(json, "transfer");
  result.status = Array.isArray(json.status) ? json.status.map(String) : [];
  result.statusInfo = describeStatuses(result.status);
  result.nameserverInfo = readNameservers(json);
  result.nameservers = result.nameserverInfo.map((entry) => entry.host);
  const secureDns = (json.secureDNS ?? {}) as Json;
  result.dnssec = typeof secureDns.delegationSigned === "boolean" ? secureDns.delegationSigned : null;
  result.dsRecords = readDs(json);
  result.notices = readNotices(json);

  const seen = new Set<string>();
  for (const entity of entities) {
    for (const role of Array.isArray(entity.roles) ? entity.roles.map(String) : []) {
      const mapped = roleMap[role];
      if (!mapped) continue;
      const contact = toContact(entity, mapped);
      if (mapped === "abuse" && contact.email !== null && contact.email === result.registrarInfo.abuseEmail) continue;
      if (!hasData(contact) && !contact.redacted) continue;
      const key = `${mapped}:${contact.email ?? contact.name ?? contact.organization ?? "redacted"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.contacts.push(contact);
    }
  }
  const registrant = result.contacts.find((contact) => contact.role === "registrant");
  result.redacted = result.contacts.some((contact) => contact.redacted) || (!registrant && result.notices.some((notice) => /data policy|redact/i.test(`${notice.title} ${notice.text}`)));
  result.raw = JSON.stringify(json, null, 2).slice(0, maxRawChars);
  return result;
}
