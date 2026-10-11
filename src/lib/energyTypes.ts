export const mixSources = ["coal", "gas", "oil", "nuclear", "hydro", "wind", "solar", "bioenergy", "otherRenewables", "imports", "other"] as const;
export type MixSource = (typeof mixSources)[number];
export type Mix = Partial<Record<MixSource, number>>;

export const mixLabels: Record<MixSource, string> = {
  coal: "Coal",
  gas: "Gas",
  oil: "Oil",
  nuclear: "Nuclear",
  hydro: "Hydro",
  wind: "Wind",
  solar: "Solar",
  bioenergy: "Bioenergy",
  otherRenewables: "Other renewables",
  imports: "Imports",
  other: "Other",
};

export const mixColors: Record<MixSource, string> = {
  coal: "#4a4a4f",
  gas: "#f4a640",
  oil: "#a2592f",
  nuclear: "#bf5af2",
  hydro: "#0a84ff",
  wind: "#64d2ff",
  solar: "#ffd60a",
  bioenergy: "#30b050",
  otherRenewables: "#66d4a6",
  imports: "#8e8e93",
  other: "#c7c7cc",
};

export const fossilSources: MixSource[] = ["coal", "gas", "oil"];
export const lowCarbonSources: MixSource[] = ["nuclear", "hydro", "wind", "solar", "bioenergy", "otherRenewables"];

export type CountryMix = { name: string; iso3: string; year: number; intensity: number; mix: Mix };
export type CountryMonthlyMix = { month: string; intensity: number; mix: Mix };
export type CountryShape = { iso2: string; polygons: number[][][] };

export type EnergyReport = {
  location: { country: string; name: string; region?: string; method: "timezone" | "precise" };
  mix: { source: MixSource; share: number }[];
  intensity: number;
  live: boolean;
  resolution: "live" | "month" | "year";
  period: string;
  source: string;
};
