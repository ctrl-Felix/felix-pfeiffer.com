import usage from "@/data/tokenUsage.json";

export function tokenTotals() {
  const totals = { processed: 0, written: 0 };
  for (const [input, output, cacheWrite, cacheRead] of Object.values(usage.messages as Record<string, number[]>)) {
    totals.processed += input + output + cacheWrite + cacheRead;
    totals.written += output;
  }
  return totals;
}

export function formatMillions(tokens: number) {
  return `${(tokens / 1_000_000).toFixed(1)} million`;
}
