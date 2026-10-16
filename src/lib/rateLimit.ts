const buckets = new Map<string, Map<string, number[]>>();
const maxTrackedKeys = 5000;

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export function tooMany(bucket: string, key: string, max: number, windowMs: number) {
  const hits = buckets.get(bucket) ?? new Map<string, number[]>();
  buckets.set(bucket, hits);
  if (hits.size > maxTrackedKeys) hits.clear();
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > max;
}

export function overMinuteLimit(bucket: string, ip: string, perIp: number, global?: number) {
  return tooMany(bucket, ip, perIp, 60_000) || (global !== undefined && tooMany(`${bucket}-global`, "all", global, 60_000));
}
