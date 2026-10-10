export function hostmasterToEmail(hostmaster: string) {
  const value = hostmaster.replace(/\.$/, "");
  const dot = value.indexOf(".");
  return dot > 0 ? `${value.slice(0, dot)}@${value.slice(dot + 1)}` : value;
}

export type TxtKind = "SPF" | "DMARC" | "DKIM" | "MTA-STS" | "TLS-RPT" | "Verification" | null;

export function classifyTxt(value: string): TxtKind {
  const text = value.trim().toLowerCase();
  if (text.startsWith("v=spf1")) return "SPF";
  if (text.startsWith("v=dmarc1")) return "DMARC";
  if (text.startsWith("v=dkim1")) return "DKIM";
  if (text.startsWith("v=stsv1")) return "MTA-STS";
  if (text.startsWith("v=tlsrptv1")) return "TLS-RPT";
  if (/(site-verification|verification|domain-verify|ms=|_globalsign|have-i-been-pwned)/.test(text)) return "Verification";
  return null;
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86_400)} d`;
}
