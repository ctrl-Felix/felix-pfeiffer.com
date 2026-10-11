import { certificateDatabase } from "./db";

export type CrtEntry = { id?: unknown; issuer_name?: unknown; common_name?: unknown; name_value?: unknown; not_before?: unknown; not_after?: unknown };
export type CertificateSearch = { entries: CrtEntry[]; complete: boolean };
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
export type DatabaseQuery = (sql: string, values: unknown[]) => Promise<{ rows: unknown[] }>;

export class TooManyCertificatesError extends Error {}

const searchUrl = "https://crt.sh/";
const websiteTimeoutMs = 20_000;
const retryStatuses = new Set([429, 502, 503, 504]);
const maxRetryWaitMs = 3000;
const maxResponseBytes = 12 * 1024 * 1024;
const maxIdentityRows = 20_000;

const identitySearch = `
WITH matches AS (
  SELECT cai.certificate, cai.issuer_ca_id, cai.name_value
  FROM certificate_and_identities cai
  WHERE plainto_tsquery('certwatch', $1) @@ identities(cai.certificate)
    AND cai.name_value ILIKE ('%' || $1)
  LIMIT $2
),
certificates AS (
  SELECT min(matches.issuer_ca_id) AS issuer_ca_id,
         x509_commonName(matches.certificate) AS common_name,
         array_to_string(array_agg(DISTINCT matches.name_value), chr(10)) AS name_value,
         to_char(x509_notBefore(matches.certificate), 'YYYY-MM-DD"T"HH24:MI:SS') AS not_before,
         to_char(x509_notAfter(matches.certificate), 'YYYY-MM-DD"T"HH24:MI:SS') AS not_after,
         encode(x509_serialNumber(matches.certificate), 'hex') AS serial_number
  FROM matches
  GROUP BY matches.certificate
)
SELECT certificates.issuer_ca_id || ':' || certificates.serial_number AS id,
       ca.name AS issuer_name,
       certificates.common_name,
       certificates.name_value,
       certificates.not_before,
       certificates.not_after,
       (SELECT count(*) FROM matches) AS matched
FROM certificates
JOIN ca ON ca.id = certificates.issuer_ca_id`;

class WebsiteError extends Error {
  constructor(readonly status: number) {
    super(`certificate search failed with ${status}`);
  }
}

const failureCode = (error: unknown) => {
  const code = (error as { code?: unknown; name?: unknown })?.code ?? (error as { name?: unknown })?.name;
  return typeof code === "string" && /^[A-Za-z0-9_]{1,40}$/.test(code) ? code : "unknown";
};

export function logSearchFailure(source: "database" | "website", error: unknown) {
  console.warn(`Certificate ${source} search failed: ${error instanceof WebsiteError ? `HTTP ${error.status}` : failureCode(error)}`);
}

export async function searchDatabase(domain: string, query: DatabaseQuery = (sql, values) => certificateDatabase().query(sql, values)): Promise<CertificateSearch> {
  const { rows } = await query(identitySearch, [domain, maxIdentityRows]);
  const matched = Number((rows[0] as { matched?: unknown } | undefined)?.matched ?? 0);
  return { entries: rows as CrtEntry[], complete: matched < maxIdentityRows };
}

async function readCapped(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxResponseBytes) {
      await reader.cancel();
      throw new TooManyCertificatesError("response too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const retryWait = (response: Response) => {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, maxRetryWaitMs) : 2000;
};

export async function searchWebsite(domain: string, unexpiredOnly: boolean, fetcher: Fetcher, wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))): Promise<CertificateSearch> {
  const params = new URLSearchParams({ q: `%.${domain}`, output: "json", deduplicate: "Y" });
  if (unexpiredOnly) params.set("exclude", "expired");
  const request = () => fetcher(`${searchUrl}?${params}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(websiteTimeoutMs), cache: "no-store" });

  let response = await request();
  if (retryStatuses.has(response.status)) {
    await response.body?.cancel();
    await wait(retryWait(response));
    response = await request();
  }
  if (!response.ok) throw new WebsiteError(response.status);
  const text = (await readCapped(response)).trim();
  if (!text) return { entries: [], complete: true };
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("unexpected certificate search response");
  return { entries: parsed as CrtEntry[], complete: true };
}
