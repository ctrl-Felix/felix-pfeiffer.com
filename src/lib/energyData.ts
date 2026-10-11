import type { CountryMix, CountryMonthlyMix, CountryShape, Mix } from "./energyTypes";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.filter((cells) => cells.length === header.length).map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index]])));
}

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

const owidShares: [keyof Mix, string][] = [
  ["coal", "coal_share_elec"],
  ["gas", "gas_share_elec"],
  ["oil", "oil_share_elec"],
  ["nuclear", "nuclear_share_elec"],
  ["hydro", "hydro_share_elec"],
  ["wind", "wind_share_elec"],
  ["solar", "solar_share_elec"],
  ["bioenergy", "biofuel_share_elec"],
  ["otherRenewables", "other_renewables_share_elec_exc_biofuel"],
];

export function countryMixes(rows: Record<string, string>[], iso3ToIso2: Map<string, string>) {
  const latest = new Map<string, Record<string, string>>();
  for (const row of rows) {
    if (!iso3ToIso2.has(row.iso_code) || !row.carbon_intensity_elec || !row.gas_share_elec) continue;
    const current = latest.get(row.iso_code);
    if (!current || Number(row.year) > Number(current.year)) latest.set(row.iso_code, row);
  }
  const result: Record<string, CountryMix> = {};
  for (const [iso3, row] of [...latest.entries()].sort()) {
    const mix: Mix = {};
    let total = 0;
    for (const [source, column] of owidShares) {
      const share = Number(row[column] || 0);
      if (share > 0) {
        mix[source] = round(share, 1);
        total += share;
      }
    }
    if (total < 100 - 0.5) mix.other = round(100 - total, 1);
    result[iso3ToIso2.get(iso3)!] = { name: row.country, iso3, year: Number(row.year), intensity: Math.round(Number(row.carbon_intensity_elec)), mix };
  }
  return result;
}

const emberFuels: Record<string, keyof Mix> = {
  Bioenergy: "bioenergy",
  Coal: "coal",
  Gas: "gas",
  Hydro: "hydro",
  Nuclear: "nuclear",
  "Other Fossil": "oil",
  "Other Renewables": "otherRenewables",
  Solar: "solar",
  Wind: "wind",
};

export function countryMonthlyMixes(rows: Record<string, string>[], iso3ToIso2: Map<string, string>) {
  const months = new Map<string, Map<string, { intensity?: number; mix: Mix; total: number }>>();
  for (const row of rows) {
    const iso3 = row["ISO 3 code"];
    if (row["Area type"] !== "Country or economy" || !iso3ToIso2.has(iso3) || !/^\d{4}-\d{2}/.test(row.Date ?? "") || row.Value === "") continue;
    const value = Number(row.Value);
    if (!Number.isFinite(value)) continue;
    const byMonth = months.get(iso3) ?? new Map();
    months.set(iso3, byMonth);
    const month = row.Date.slice(0, 7);
    const entry = byMonth.get(month) ?? { mix: {}, total: 0 };
    byMonth.set(month, entry);
    if (row.Variable === "CO2 intensity" && row.Unit === "gCO2/kWh") entry.intensity = value;
    const source = emberFuels[row.Variable];
    if (source && row.Subcategory === "Fuel" && row.Unit === "%" && value > 0) {
      entry.mix[source] = round((entry.mix[source] ?? 0) + value, 1);
      entry.total += value;
    }
  }
  const result: Record<string, CountryMonthlyMix> = {};
  for (const [iso3, byMonth] of [...months.entries()].sort()) {
    const complete = [...byMonth.entries()].filter(([, entry]) => entry.intensity !== undefined && entry.total > 95).sort(([a], [b]) => b.localeCompare(a));
    if (!complete.length) continue;
    const [month, entry] = complete[0];
    const mix: Mix = { ...entry.mix };
    if (entry.total < 100 - 0.5) mix.other = round(100 - entry.total, 1);
    result[iso3ToIso2.get(iso3)!] = { month, intensity: Math.round(entry.intensity!), mix };
  }
  return result;
}

type Feature = { properties: Record<string, string | number>; geometry: { type: string; coordinates: number[][][] | number[][][][] } };

export function iso2Of(properties: Feature["properties"]) {
  for (const key of ["ISO_A2", "ISO_A2_EH"]) {
    const value = String(properties[key] ?? "");
    if (/^[A-Z]{2}$/.test(value)) return value;
  }
  return null;
}

export function iso3Of(properties: Feature["properties"]) {
  for (const key of ["ISO_A3", "ISO_A3_EH", "ADM0_A3"]) {
    const value = String(properties[key] ?? "");
    if (/^[A-Z]{3}$/.test(value)) return value;
  }
  return null;
}

export function countryCodes(features: Feature[]) {
  const codes = new Map<string, string>();
  for (const feature of features) {
    const iso2 = iso2Of(feature.properties);
    const iso3 = iso3Of(feature.properties);
    if (iso2 && iso3) codes.set(iso3, iso2);
  }
  return codes;
}

const flatRing = (ring: number[][]) => ring.flatMap(([longitude, latitude]) => [round(longitude, 2), round(latitude, 2)]);

export function countryShapes(features: Feature[]): CountryShape[] {
  const shapes: CountryShape[] = [];
  for (const feature of features) {
    const iso2 = iso2Of(feature.properties);
    if (!iso2) continue;
    const polygons = (feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates) as number[][][][];
    shapes.push({ iso2, polygons: polygons.map((rings) => rings.map(flatRing)) });
  }
  return shapes;
}

export function timezoneCountries(zoneTab: string, tzdata: string) {
  const zones: Record<string, string> = {};
  for (const line of zoneTab.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const [country, , zone] = line.split("\t");
    if (/^[A-Z]{2}$/.test(country) && zone) zones[zone] = country;
  }
  for (const line of tzdata.split("\n")) {
    const [kind, target, link] = line.split(" ");
    if (kind === "L" && zones[target] && !zones[link]) zones[link] = zones[target];
  }
  return Object.fromEntries(Object.entries(zones).sort());
}
