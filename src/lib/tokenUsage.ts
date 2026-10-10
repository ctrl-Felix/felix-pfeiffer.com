import usage from "@/data/tokenUsage.json";

type Entry = [model: string, input: number, output: number, cacheWrite: number, cacheRead: number];
export type ModelTotals = { model: string; processed: number; written: number; calls: number };

export function modelName(model: string) {
  const match = model.match(/^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?$/);
  if (!match) return model === "unknown" ? "Unknown model" : model;
  const [, family, major, minor] = match;
  return `${family[0].toUpperCase()}${family.slice(1)} ${major}${minor ? `.${minor}` : ""}`;
}

export function tokenTotals() {
  const perModel = new Map<string, ModelTotals>();
  for (const [model, input, output, cacheWrite, cacheRead] of Object.values(usage.messages as unknown as Record<string, Entry>)) {
    const totals = perModel.get(model) ?? { model, processed: 0, written: 0, calls: 0 };
    totals.processed += input + output + cacheWrite + cacheRead;
    totals.written += output;
    totals.calls += 1;
    perModel.set(model, totals);
  }
  const models = [...perModel.values()].sort((a, b) => b.processed - a.processed);
  return {
    processed: models.reduce((sum, item) => sum + item.processed, 0),
    written: models.reduce((sum, item) => sum + item.written, 0),
    calls: models.reduce((sum, item) => sum + item.calls, 0),
    models,
  };
}

export function formatMillions(tokens: number) {
  return `${(tokens / 1_000_000).toFixed(1)} million`;
}
