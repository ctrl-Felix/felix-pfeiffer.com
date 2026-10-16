import mixes from "@/data/energy/countryMix.json";
import monthlyMixes from "@/data/energy/countryMonthlyMix.json";
import { countryAt, countryFromTimezone, countryOfNearestBorder } from "./energyGeo";
import { energyChartsCountries, intensityFromMix, liveEnergyCharts, liveGreatBritain, outcodeAt } from "./energyLive";
import type { CountryMix, CountryMonthlyMix, EnergyReport, Mix, MixSource } from "./energyTypes";

const countryMixes = mixes as Record<string, CountryMix>;
const countryMonthlyMixes = monthlyMixes as Record<string, CountryMonthlyMix>;
const maxMonthlyAgeMonths = 12;
const liveTtlMs = 15 * 60_000;
const liveCache = new Map<string, { at: number; value: Live | null }>();

type Live = { mix: Mix; intensity: number; period: string; source: string; region?: string };
type EnergyQuery = { timezone?: string; latitude?: number; longitude?: number };

const isKnownCountry = (country: string) => Object.hasOwn(countryMixes, country);

async function cached(key: string, load: () => Promise<Live | null>) {
  const hit = liveCache.get(key);
  if (hit && Date.now() - hit.at < liveTtlMs) return hit.value;
  const value = await load().catch(() => null);
  liveCache.set(key, { at: Date.now(), value });
  return value;
}

async function liveData(fetcher: typeof fetch, country: string, latitude?: number, longitude?: number): Promise<Live | null> {
  if (country === "GB") {
    const outcode = latitude === undefined || longitude === undefined ? undefined : await outcodeAt(fetcher, latitude, longitude).catch(() => undefined);
    return cached(`GB:${outcode ?? ""}`, async () => {
      const live = await liveGreatBritain(fetcher, outcode);
      return live && { mix: live.mix, intensity: Math.round(live.intensity), period: live.time, source: "Carbon Intensity API (National Energy System Operator)", region: live.region };
    });
  }
  if (energyChartsCountries.has(country)) {
    return cached(country, async () => {
      const live = await liveEnergyCharts(fetcher, country);
      return live && { mix: live.mix, intensity: intensityFromMix(live.mix), period: new Date(live.time * 1000).toISOString(), source: "Energy-Charts (Fraunhofer ISE)" };
    });
  }
  return null;
}

export function recentMonthly(country: string, now = new Date()) {
  const monthly = countryMonthlyMixes[country];
  if (!monthly) return null;
  const [year, month] = monthly.month.split("-").map(Number);
  const age = (now.getUTCFullYear() - year) * 12 + now.getUTCMonth() + 1 - month;
  const yearly = countryMixes[country];
  return age <= maxMonthlyAgeMonths && (!yearly || year >= yearly.year) ? monthly : null;
}

const sortedMix = (mix: Mix) =>
  (Object.entries(mix) as [MixSource, number][]).map(([source, share]) => ({ source, share })).sort((a, b) => b.share - a.share);

function countryNear(latitude: number, longitude: number) {
  return countryAt(latitude, longitude) ?? countryOfNearestBorder(latitude, longitude, 50);
}

export function locate(query: EnergyQuery) {
  if (query.latitude !== undefined && query.longitude !== undefined) {
    const country = countryNear(query.latitude, query.longitude);
    if (country && isKnownCountry(country)) return { country, method: "precise" as const };
  }
  const country = query.timezone ? countryFromTimezone(query.timezone) : null;
  return country && isKnownCountry(country) ? { country, method: "timezone" as const } : null;
}

export async function energyReport(query: EnergyQuery, fetcher: typeof fetch = fetch, now = new Date()): Promise<EnergyReport | null> {
  const located = locate(query);
  if (!located) return null;
  const precise = located.method === "precise";
  const yearly = countryMixes[located.country];
  const live = await liveData(fetcher, located.country, precise ? query.latitude : undefined, precise ? query.longitude : undefined);
  const location = { country: located.country, name: yearly.name, ...(live?.region ? { region: live.region } : {}), method: located.method };
  if (live) return { location, mix: sortedMix(live.mix), intensity: live.intensity, live: true, resolution: "live", period: live.period, source: live.source };

  const monthly = recentMonthly(located.country, now);
  if (monthly) return { location, mix: sortedMix(monthly.mix), intensity: monthly.intensity, live: false, resolution: "month", period: monthly.month, source: "Ember monthly electricity data" };

  return { location, mix: sortedMix(yearly.mix), intensity: yearly.intensity, live: false, resolution: "year", period: String(yearly.year), source: "Our World in Data (Ember, Energy Institute)" };
}

const timezonePattern = /^[A-Za-z][A-Za-z0-9_+\-/]{0,63}$/;

function coordinate(value: string | null, limit: number) {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? Math.round(number * 100) / 100 : null;
}

export function parseEnergyQuery(params: URLSearchParams): EnergyQuery | null {
  const timezone = params.get("tz") ?? undefined;
  if (timezone !== undefined && !timezonePattern.test(timezone)) return null;
  const latitude = coordinate(params.get("lat"), 90);
  const longitude = coordinate(params.get("lon"), 180);
  if (latitude === null || longitude === null || (latitude === undefined) !== (longitude === undefined)) return null;
  if (!timezone && latitude === undefined) return null;
  return { timezone, latitude, longitude };
}
