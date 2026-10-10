import type { StatusInfo, StatusSeverity } from "./whoisTypes";

type Entry = { label: string; explanation: string; severity: StatusSeverity };

const entries: Record<string, Entry> = {
  ok: { label: "Active", explanation: "The domain is active and has no pending operations or restrictions.", severity: "good" },
  active: { label: "Active", explanation: "The domain is active.", severity: "good" },
  connect: { label: "Active", explanation: "The domain is registered and delegated.", severity: "good" },
  registered: { label: "Registered", explanation: "The domain is registered.", severity: "good" },
  inactive: { label: "Inactive", explanation: "The domain has no name servers, so it does not resolve.", severity: "warning" },
  clienttransferprohibited: { label: "Transfer lock", explanation: "The registrar blocks transfers to another registrar. This is a normal protection.", severity: "lock" },
  clientupdateprohibited: { label: "Update lock", explanation: "The registrar blocks changes to the domain record.", severity: "lock" },
  clientdeleteprohibited: { label: "Delete lock", explanation: "The registrar blocks deleting the domain.", severity: "lock" },
  clientrenewprohibited: { label: "Renew lock", explanation: "The registrar blocks renewing the domain.", severity: "lock" },
  clienthold: { label: "Registrar hold", explanation: "The registrar removed the domain from the DNS, so it does not resolve.", severity: "danger" },
  servertransferprohibited: { label: "Registry transfer lock", explanation: "The registry blocks transfers to another registrar.", severity: "lock" },
  serverupdateprohibited: { label: "Registry update lock", explanation: "The registry blocks changes to the domain record.", severity: "lock" },
  serverdeleteprohibited: { label: "Registry delete lock", explanation: "The registry blocks deleting the domain.", severity: "lock" },
  serverrenewprohibited: { label: "Registry renew lock", explanation: "The registry blocks renewing the domain.", severity: "lock" },
  serverhold: { label: "Registry hold", explanation: "The registry removed the domain from the DNS, so it does not resolve.", severity: "danger" },
  pendingcreate: { label: "Pending create", explanation: "The registration is being processed.", severity: "pending" },
  pendingrenew: { label: "Pending renew", explanation: "A renewal is being processed.", severity: "pending" },
  pendingtransfer: { label: "Pending transfer", explanation: "A transfer to another registrar is in progress.", severity: "pending" },
  pendingupdate: { label: "Pending update", explanation: "A change to the domain is being processed.", severity: "pending" },
  pendingrestore: { label: "Pending restore", explanation: "A restore from the redemption period is being processed.", severity: "pending" },
  pendingdelete: { label: "Pending delete", explanation: "The domain is about to be deleted and released for registration.", severity: "danger" },
  redemptionperiod: { label: "Redemption period", explanation: "The domain expired and was deleted. The owner can still restore it for a fee.", severity: "danger" },
  addperiod: { label: "Add grace period", explanation: "The domain was registered recently and can be cancelled for a refund.", severity: "info" },
  autorenewperiod: { label: "Auto-renew grace period", explanation: "The domain was automatically renewed and can still be cancelled.", severity: "info" },
  renewperiod: { label: "Renew grace period", explanation: "The domain was renewed recently and the renewal can still be cancelled.", severity: "info" },
  transferperiod: { label: "Transfer grace period", explanation: "The domain was transferred recently and the transfer can still be cancelled.", severity: "info" },
  quarantine: { label: "Quarantine", explanation: "The domain is held after deletion and cannot be registered yet.", severity: "danger" },
  expired: { label: "Expired", explanation: "The registration has expired.", severity: "danger" },
  free: { label: "Available", explanation: "The domain is not registered.", severity: "info" },
  "removed delete": { label: "Removed", explanation: "The registration was removed.", severity: "danger" },
  locked: { label: "Locked", explanation: "The domain is locked against changes.", severity: "lock" },
  "transfer prohibited": { label: "Transfer lock", explanation: "Transfers to another registrar are blocked.", severity: "lock" },
};

const knownCamel = /([a-z])([A-Z])/g;

export function normalizeStatusCode(raw: string) {
  const first = raw.trim().split(/\s+/);
  const word = /^https?:/i.test(first[first.length - 1] ?? "") && first.length > 1 ? first.slice(0, -1).join(" ") : raw.trim();
  return word.replace(/^["']|["']$/g, "");
}

const keyOf = (code: string) => code.toLowerCase().replace(/[\s_-]+/g, "");

function labelFromCode(code: string) {
  const spaced = code.replace(knownCamel, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : code;
}

export function describeStatus(raw: string): StatusInfo {
  const code = normalizeStatusCode(raw);
  const entry = entries[keyOf(code)] ?? entries[code.toLowerCase()];
  if (entry) return { code, ...entry };
  return { code, label: labelFromCode(code), explanation: null, severity: "info" };
}

export function describeStatuses(codes: string[]) {
  const seen = new Set<string>();
  const result: StatusInfo[] = [];
  for (const raw of codes) {
    const info = describeStatus(raw);
    const key = keyOf(info.code);
    if (!info.code || seen.has(key)) continue;
    seen.add(key);
    result.push(info);
  }
  return result;
}
