import plantRows from "@/data/energy/powerPlants.json";
import shapes from "@/data/energy/countryShapes.json";
import timezones from "@/data/energy/timezones.json";
import { plantFuels, type CountryShape, type Plant, type PlantRow } from "./energyTypes";

const plants = plantRows as unknown as PlantRow[];

export function countryFromTimezone(zone: string) {
  return (timezones as Record<string, string>)[zone] ?? null;
}

function insideRing(ring: number[], longitude: number, latitude: number) {
  let inside = false;
  for (let index = 0, previous = ring.length - 2; index < ring.length; previous = index, index += 2) {
    const [x1, y1, x2, y2] = [ring[index], ring[index + 1], ring[previous], ring[previous + 1]];
    if (y1 > latitude !== y2 > latitude && longitude < ((x2 - x1) * (latitude - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

export function countryAt(latitude: number, longitude: number) {
  for (const shape of shapes as CountryShape[]) {
    for (const [outer, ...holes] of shape.polygons) {
      if (insideRing(outer, longitude, latitude) && !holes.some((hole) => insideRing(hole, longitude, latitude))) return shape.iso2;
    }
  }
  return null;
}

export function countryOfNearestPlant(latitude: number, longitude: number, maxKm: number) {
  let best: { iso3: string; distance: number } | null = null;
  for (const row of plants) {
    const distance = distanceKm(latitude, longitude, row[0], row[1]);
    if (distance <= maxKm && (!best || distance < best.distance)) best = { iso3: row[5], distance };
  }
  return best?.iso3 ?? null;
}

export function distanceKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const radians = Math.PI / 180;
  const deltaLatitude = (latitudeB - latitudeA) * radians;
  const deltaLongitude = (longitudeB - longitudeA) * radians;
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitudeA * radians) * Math.cos(latitudeB * radians) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const toPlant = (row: PlantRow, distance?: number): Plant => ({
  name: row[4],
  fuel: plantFuels[row[3]] ?? "other",
  capacityMw: row[2],
  ...(distance === undefined ? {} : { distanceKm: Math.round(distance) }),
});

export function nearestPlants(latitude: number, longitude: number, limit = 5) {
  return plants
    .map((row) => ({ row, distance: distanceKm(latitude, longitude, row[0], row[1]) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ row, distance }) => toPlant(row, distance));
}

export function largestPlants(iso3: string, limit = 5) {
  return plants
    .filter((row) => row[5] === iso3)
    .sort((a, b) => b[2] - a[2])
    .slice(0, limit)
    .map((row) => toPlant(row));
}
