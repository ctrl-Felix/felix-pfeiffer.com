import type { Mix, MixSource } from "./energyTypes";

const lifecycleFactors: Record<MixSource, number> = {
  coal: 820,
  gas: 490,
  oil: 650,
  nuclear: 12,
  hydro: 24,
  wind: 11,
  solar: 45,
  bioenergy: 230,
  otherRenewables: 38,
  imports: 300,
  other: 700,
};

export function intensityFromMix(mix: Mix) {
  const entries = Object.entries(mix) as [MixSource, number][];
  const total = entries.reduce((sum, [, share]) => sum + share, 0);
  if (!total) return 0;
  return Math.round(entries.reduce((sum, [source, share]) => sum + lifecycleFactors[source] * share, 0) / total);
}

function normalize(values: Mix): Mix {
  const total = Object.values(values).reduce((sum, value) => sum + (value ?? 0), 0);
  if (!total) return {};
  const mix: Mix = {};
  for (const [source, value] of Object.entries(values) as [MixSource, number][]) {
    const share = Math.round((value / total) * 1000) / 10;
    if (share > 0) mix[source] = share;
  }
  return mix;
}

const carbonIntensityFuels: Record<string, MixSource> = {
  biomass: "bioenergy",
  coal: "coal",
  imports: "imports",
  gas: "gas",
  nuclear: "nuclear",
  other: "other",
  hydro: "hydro",
  solar: "solar",
  wind: "wind",
};

type GenerationMix = { fuel?: unknown; perc?: unknown }[];

export function mixFromCarbonIntensity(generationMix: unknown): Mix | null {
  if (!Array.isArray(generationMix)) return null;
  const values: Mix = {};
  for (const item of generationMix as GenerationMix) {
    const source = typeof item.fuel === "string" ? carbonIntensityFuels[item.fuel] : undefined;
    if (source && typeof item.perc === "number" && item.perc > 0) values[source] = (values[source] ?? 0) + item.perc;
  }
  const mix = normalize(values);
  return Object.keys(mix).length ? mix : null;
}

export function energyChartsSource(name: string): MixSource | null {
  const lower = name.toLowerCase();
  if (/consumption|pumped|load|share|trading|import|export/.test(lower)) return null;
  if (/biomass|biogas/.test(lower)) return "bioenergy";
  if (/lignite|coal/.test(lower)) return "coal";
  if (lower.includes("gas")) return "gas";
  if (lower.includes("oil")) return "oil";
  if (lower.includes("nuclear")) return "nuclear";
  if (lower.includes("hydro")) return "hydro";
  if (lower.includes("wind")) return "wind";
  if (lower.includes("solar")) return "solar";
  if (/geothermal|renewable/.test(lower)) return "otherRenewables";
  if (/waste|other/.test(lower)) return "other";
  return null;
}

type PublicPower = { unix_seconds?: unknown; production_types?: { name?: unknown; data?: unknown }[] };

export function mixFromEnergyCharts(body: unknown): { mix: Mix; time: number } | null {
  const { unix_seconds: seconds, production_types: types } = (body ?? {}) as PublicPower;
  if (!Array.isArray(seconds) || !Array.isArray(types)) return null;
  const series = types
    .map((type) => ({ source: typeof type.name === "string" ? energyChartsSource(type.name) : null, data: Array.isArray(type.data) ? type.data : [] }))
    .filter((item): item is { source: MixSource; data: unknown[] } => item.source !== null);
  if (!series.length) return null;
  for (let index = seconds.length - 1; index >= 0; index--) {
    const present = series.filter((item) => typeof item.data[index] === "number");
    if (present.length < series.length * 0.7) continue;
    const values: Mix = {};
    for (const item of present) {
      const value = item.data[index] as number;
      if (value > 0) values[item.source] = (values[item.source] ?? 0) + value;
    }
    const mix = normalize(values);
    if (Object.keys(mix).length && typeof seconds[index] === "number") return { mix, time: seconds[index] as number };
  }
  return null;
}

export const energyChartsCountries = new Set([
  "AT", "BE", "BG", "CH", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SI", "SK",
]);

type Fetcher = typeof fetch;

async function getJson(fetcher: Fetcher, url: string) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(5000), headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
}

export async function liveGreatBritain(fetcher: Fetcher, outcode?: string) {
  if (outcode) {
    const body = await getJson(fetcher, `https://api.carbonintensity.org.uk/regional/postcode/${encodeURIComponent(outcode)}`);
    const region = body?.data?.[0];
    const period = region?.data?.[0];
    const mix = mixFromCarbonIntensity(period?.generationmix);
    const intensity = period?.intensity?.forecast;
    if (!mix || typeof intensity !== "number") return null;
    return { mix, intensity, time: String(period.from ?? ""), region: typeof region.shortname === "string" ? region.shortname : undefined };
  }
  const [generation, intensityBody] = await Promise.all([
    getJson(fetcher, "https://api.carbonintensity.org.uk/generation"),
    getJson(fetcher, "https://api.carbonintensity.org.uk/intensity"),
  ]);
  const mix = mixFromCarbonIntensity(generation?.data?.generationmix);
  const reading = intensityBody?.data?.[0]?.intensity;
  const intensity = typeof reading?.actual === "number" ? reading.actual : reading?.forecast;
  if (!mix || typeof intensity !== "number") return null;
  return { mix, intensity, time: String(generation.data.from ?? ""), region: undefined };
}

export async function outcodeAt(fetcher: Fetcher, latitude: number, longitude: number) {
  const body = await getJson(fetcher, `https://api.postcodes.io/postcodes?lon=${longitude}&lat=${latitude}&limit=1&radius=2000`);
  const outcode = body?.result?.[0]?.outcode;
  return typeof outcode === "string" && /^[A-Z0-9]{2,4}$/.test(outcode) ? outcode : undefined;
}

export async function liveEnergyCharts(fetcher: Fetcher, country: string) {
  const body = await getJson(fetcher, `https://api.energy-charts.info/public_power?country=${country.toLowerCase()}`);
  return mixFromEnergyCharts(body);
}
