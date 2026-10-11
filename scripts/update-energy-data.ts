import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { countryCodes, countryMixes, countryMonthlyMixes, countryShapes, parseCsv, timezoneCountries } from "../src/lib/energyData";

const sources = {
  mix: process.env.OWID_ENERGY_URL ?? "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv",
  monthly: process.env.EMBER_MONTHLY_URL ?? "https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/monthly_full_release_long_format.csv",
  countries: process.env.NE_COUNTRIES_URL ?? "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
};
const zoneinfo = process.env.ZONEINFO_DIR ?? "/usr/share/zoneinfo";
const directory = join(__dirname, "..", "src", "data", "energy");

async function download(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

async function main() {
  const [mixCsv, monthlyCsv, countriesJson, zoneTab, tzdata] = await Promise.all([
    download(sources.mix),
    download(sources.monthly),
    download(sources.countries),
    readFile(join(zoneinfo, "zone.tab"), "utf8"),
    readFile(join(zoneinfo, "tzdata.zi"), "utf8"),
  ]);
  const countries = JSON.parse(countriesJson).features;
  const codes = countryCodes(countries);
  const mixes = countryMixes(parseCsv(mixCsv), codes);
  const monthly = countryMonthlyMixes(parseCsv(monthlyCsv), codes);
  const shapes = countryShapes(countries);
  const zones = timezoneCountries(zoneTab, tzdata);
  if (Object.keys(mixes).length < 100 || Object.keys(monthly).length < 50 || shapes.length < 200) throw new Error("A source looks incomplete, nothing written.");

  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "countryMix.json"), `${JSON.stringify(mixes)}\n`);
  await writeFile(join(directory, "countryMonthlyMix.json"), `${JSON.stringify(monthly)}\n`);
  await writeFile(join(directory, "countryShapes.json"), `${JSON.stringify(shapes)}\n`);
  await writeFile(join(directory, "timezones.json"), `${JSON.stringify(zones)}\n`);
  console.log(`${Object.keys(mixes).length} yearly and ${Object.keys(monthly).length} monthly country mixes, ${shapes.length} country shapes, ${Object.keys(zones).length} time zones.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
