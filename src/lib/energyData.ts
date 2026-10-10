import { plantFuels, type CountryMix, type CountryShape, type Mix, type PlantFuel, type PlantRow } from "./energyTypes";

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

const wriFuels: Record<string, PlantFuel> = {
  Coal: "coal",
  Petcoke: "coal",
  Gas: "gas",
  Oil: "oil",
  Nuclear: "nuclear",
  Hydro: "hydro",
  Wind: "wind",
  Solar: "solar",
  Biomass: "bioenergy",
  Geothermal: "geothermal",
  Waste: "waste",
  Storage: "storage",
  "Wave and Tidal": "tidal",
};

export function powerPlants(rows: Record<string, string>[]): PlantRow[] {
  return rows
    .map((row): PlantRow | null => {
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      const capacity = Number(row.capacity_mw);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !(capacity > 0)) return null;
      const fuel = plantFuels.indexOf(wriFuels[row.primary_fuel] ?? "other");
      return [round(latitude, 3), round(longitude, 3), round(capacity, 1), fuel, row.name.trim().slice(0, 60), row.country];
    })
    .filter((row): row is PlantRow => row !== null);
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
