import shapes from "@/data/energy/countryShapes.json";
import timezones from "@/data/energy/timezones.json";
import type { CountryShape } from "./energyTypes";

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

export function countryOfNearestBorder(latitude: number, longitude: number, maxKm: number) {
  const marginDegrees = maxKm / 111 / Math.max(Math.cos((latitude * Math.PI) / 180), 0.05);
  let best: { iso2: string; distance: number } | null = null;
  for (const shape of shapes as CountryShape[]) {
    for (const ring of shape.polygons.flat()) {
      for (let index = 0; index < ring.length; index += 2) {
        const [pointLongitude, pointLatitude] = [ring[index], ring[index + 1]];
        if (Math.abs(pointLatitude - latitude) > maxKm / 111 || Math.abs(pointLongitude - longitude) > marginDegrees) continue;
        const distance = distanceKm(latitude, longitude, pointLatitude, pointLongitude);
        if (distance <= maxKm && (!best || distance < best.distance)) best = { iso2: shape.iso2, distance };
      }
    }
  }
  return best?.iso2 ?? null;
}

export function distanceKm(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const radians = Math.PI / 180;
  const deltaLatitude = (latitudeB - latitudeA) * radians;
  const deltaLongitude = (longitudeB - longitudeA) * radians;
  const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitudeA * radians) * Math.cos(latitudeB * radians) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
