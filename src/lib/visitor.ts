import { createHmac, randomBytes } from "node:crypto";
import { db } from "./db";

const botPattern =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python-requests|httpclient|go-http-client|okhttp|axios|node-fetch|undici|java\/|libwww|uptime|monitor|pingdom|statuscake|gtmetrix|pagespeed|semrush|ahrefs|mj12|petalbot|yandex|baidu|archive\.org/i;

let cachedSalt: { day: string; value: Buffer } | null = null;

export const isBot = (userAgent: string) => !userAgent || botPattern.test(userAgent);

async function dailySalt() {
  const today = new Date().toISOString().slice(0, 10);
  if (cachedSalt?.day === today) return cachedSalt.value;
  const pool = db();
  await pool.query("insert into daily_salts (day, salt) values ($1, $2) on conflict (day) do nothing", [today, randomBytes(32)]);
  const { rows } = await pool.query("select salt from daily_salts where day = $1", [today]);
  await pool.query("delete from daily_salts where day < $1", [today]);
  cachedSalt = { day: today, value: rows[0].salt };
  return cachedSalt.value;
}

function expandIpv6(address: string) {
  const [head, tail = ""] = address.split("::");
  const first = head ? head.split(":") : [];
  const last = tail ? tail.split(":") : [];
  const fill = address.includes("::") ? Array(Math.max(8 - first.length - last.length, 0)).fill("0") : [];
  return [...first, ...fill, ...last].map((group) => group.padStart(4, "0").toLowerCase());
}

export function networkOf(ip: string) {
  const clean = ip.split("%")[0];
  const mapped = clean.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (!clean.includes(":")) return clean;
  return expandIpv6(clean).slice(0, 4).join(":");
}

export async function visitorId(ip: string, userAgent: string) {
  const salt = await dailySalt();
  return createHmac("sha256", salt).update(`${networkOf(ip)}|${userAgent}`).digest("hex").slice(0, 32);
}
