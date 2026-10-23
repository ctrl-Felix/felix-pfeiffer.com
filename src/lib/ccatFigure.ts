import type { Figure, Glyph, Shape } from "@/data/ccat/types";

const rotationalOrder: Record<Shape, number> = {
  circle: 0,
  dot: 0,
  square: 4,
  diamond: 2,
  triangle: 3,
  pentagon: 5,
  hexagon: 6,
  star: 5,
  cross: 4,
  arrow: 1,
  flag: 1,
  hook: 1,
  clock: 1,
  half: 1,
};

const chiralShapes = new Set<Shape>(["flag", "hook"]);

const modulo = (value: number, base: number) => ((value % base) + base) % base;

export const isFigure = (option: unknown): option is Figure => Array.isArray(option);

export function glyphKey(glyph: Glyph) {
  const order = rotationalOrder[glyph.shape];
  const rotation = order === 0 ? 0 : modulo(glyph.rotation ?? 0, 360 / order);
  const mirror = glyph.mirror && chiralShapes.has(glyph.shape) ? "m" : "";
  return [glyph.shape, rotation, mirror, glyph.solid ? "s" : "", glyph.cell ?? ""].join("/");
}

export function figureKey(figure: Figure) {
  const keys = figure.map(glyphKey);
  if (figure.every((glyph) => glyph.cell !== undefined)) keys.sort();
  return keys.join("+");
}
