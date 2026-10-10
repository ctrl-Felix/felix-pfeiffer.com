import assert from "node:assert/strict";
import { test } from "node:test";
import { energyReport, locate, parseEnergyQuery } from "./energy";
import { countryMixes, parseCsv, timezoneCountries } from "./energyData";
import { countryAt, countryFromTimezone, countryOfNearestBorder, distanceKm } from "./energyGeo";
import { energyChartsSource, intensityFromMix, mixFromCarbonIntensity, mixFromEnergyCharts } from "./energyLive";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
const offline = (async () => {
  throw new Error("offline");
}) as unknown as typeof fetch;

test("the CSV parser handles quotes, commas and line breaks", () => {
  const rows = parseCsv('name,value\n"A, B",1\r\n"say ""hi""",2\n');
  assert.deepEqual(rows, [{ name: "A, B", value: "1" }, { name: 'say "hi"', value: "2" }]);
});

test("yearly country mixes take the latest year and fill the rest as other", () => {
  const rows: Record<string, string>[] = [
    { iso_code: "GBR", country: "United Kingdom", year: "2023", carbon_intensity_elec: "230", gas_share_elec: "35", wind_share_elec: "30" },
    { iso_code: "GBR", country: "United Kingdom", year: "2024", carbon_intensity_elec: "210", gas_share_elec: "30", wind_share_elec: "32" },
    { iso_code: "XXX", country: "Nowhere", year: "2024", carbon_intensity_elec: "1", gas_share_elec: "1" },
  ];
  const mixes = countryMixes(rows, new Map([["GBR", "GB"]]));
  assert.deepEqual(mixes, { GB: { name: "United Kingdom", iso3: "GBR", year: 2024, intensity: 210, mix: { gas: 30, wind: 32, other: 38 } } });
});

test("time zones map to countries, including old link names", () => {
  const zones = timezoneCountries("# comment\nGB\t+513030-0000731\tEurope/London\nUA\t+5026+03031\tEurope/Kyiv\n", "L Europe/Kyiv Europe/Kiev\n");
  assert.deepEqual(zones, { "Europe/Kiev": "UA", "Europe/Kyiv": "UA", "Europe/London": "GB" });
  assert.equal(countryFromTimezone("Europe/London"), "GB");
  assert.equal(countryFromTimezone("America/New_York"), "US");
  assert.equal(countryFromTimezone("Mars/Base"), null);
});

test("coordinates are placed in the right country, near a coast by the nearest border", () => {
  assert.equal(countryAt(51.5, -0.12), "GB");
  assert.equal(countryAt(48.86, 2.35), "FR");
  assert.equal(countryAt(52.52, 13.4), "DE");
  assert.equal(countryAt(40.78, -73.96), "US");
  assert.equal(countryAt(0, -30), null);
  assert.ok(Math.abs(distanceKm(51.5, -0.12, 48.86, 2.35) - 343) < 5);
  assert.equal(countryOfNearestBorder(40.75, -73.99, 50), "US");
  assert.equal(countryOfNearestBorder(0, -30, 50), null);
});

test("live grid data is parsed defensively", () => {
  assert.deepEqual(mixFromCarbonIntensity([{ fuel: "gas", perc: 30 }, { fuel: "wind", perc: 60 }, { fuel: "biomass", perc: 10 }, { fuel: "mystery", perc: 5 }]), { gas: 30, wind: 60, bioenergy: 10 });
  assert.equal(mixFromCarbonIntensity("nope"), null);
  assert.equal(energyChartsSource("Fossil brown coal / lignite"), "coal");
  assert.equal(energyChartsSource("Biogas"), "bioenergy");
  assert.equal(energyChartsSource("Hydro pumped storage"), null);
  assert.equal(energyChartsSource("Load"), null);
  const body = {
    unix_seconds: [1, 2, 3],
    production_types: [
      { name: "Fossil gas", data: [10, 20, null] },
      { name: "Wind onshore", data: [30, 60, null] },
      { name: "Solar", data: [0, 20, null] },
      { name: "Load", data: [50, 100, 100] },
    ],
  };
  assert.deepEqual(mixFromEnergyCharts(body), { mix: { gas: 20, wind: 60, solar: 20 }, time: 2 });
  assert.equal(mixFromEnergyCharts({}), null);
  assert.equal(intensityFromMix({ coal: 50, wind: 50 }), 416);
});

test("queries are validated and rounded", () => {
  assert.deepEqual(parseEnergyQuery(new URLSearchParams("tz=Europe/London")), { timezone: "Europe/London", latitude: undefined, longitude: undefined });
  assert.deepEqual(parseEnergyQuery(new URLSearchParams("lat=51.50731&lon=-0.12776")), { timezone: undefined, latitude: 51.51, longitude: -0.13 });
  assert.equal(parseEnergyQuery(new URLSearchParams("lat=95&lon=0")), null);
  assert.equal(parseEnergyQuery(new URLSearchParams("lat=51")), null);
  assert.equal(parseEnergyQuery(new URLSearchParams("tz=../../etc")), null);
  assert.equal(parseEnergyQuery(new URLSearchParams("")), null);
  assert.deepEqual(locate({ timezone: "Europe/Paris", latitude: 51.5, longitude: -0.12 }), { country: "GB", method: "precise" });
  assert.deepEqual(locate({ timezone: "Europe/Paris", latitude: 0, longitude: -30 }), { country: "FR", method: "timezone" });
  assert.deepEqual(locate({ latitude: 40.75, longitude: -73.99 }), { country: "US", method: "precise" }, "a point on the coast falls back to the nearest border");
});

test("without live data the report falls back to the yearly mix", async () => {
  const report = await energyReport({ timezone: "America/New_York" }, offline);
  assert.ok(report);
  assert.equal(report.location.country, "US");
  assert.equal(report.live, false);
  assert.match(report.period, /^\d{4}$/);
  assert.ok(Math.abs(report.mix.reduce((sum, item) => sum + item.share, 0) - 100) < 1);
});

test("Great Britain uses the live regional carbon intensity with a precise location", async () => {
  const fetcher = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("https://api.postcodes.io/")) return json({ result: [{ outcode: "SW1A" }] });
    if (url === "https://api.carbonintensity.org.uk/regional/postcode/SW1A") {
      return json({ data: [{ shortname: "London", data: [{ from: "2026-10-10T23:00Z", intensity: { forecast: 150 }, generationmix: [{ fuel: "gas", perc: 40 }, { fuel: "wind", perc: 60 }] }] }] });
    }
    throw new Error(url);
  }) as typeof fetch;
  const report = await energyReport({ timezone: "Europe/London", latitude: 51.5, longitude: -0.14 }, fetcher);
  assert.ok(report);
  assert.equal(report.live, true);
  assert.equal(report.intensity, 150);
  assert.equal(report.location.region, "London");
  assert.deepEqual(report.mix, [{ source: "wind", share: 60 }, { source: "gas", share: 40 }]);
  assert.equal(report.location.method, "precise");
});
