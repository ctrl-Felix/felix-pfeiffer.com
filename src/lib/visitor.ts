import { createHmac, randomBytes } from "node:crypto";

const botPattern = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python-requests|httpclient/i;

let salt = { day: "", value: randomBytes(32) };

export const isBot = (userAgent: string) => !userAgent || botPattern.test(userAgent);

export function visitorId(ip: string, userAgent: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (salt.day !== today) salt = { day: today, value: randomBytes(32) };
  return createHmac("sha256", salt.value).update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}
