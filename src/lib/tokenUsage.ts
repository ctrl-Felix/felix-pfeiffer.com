import usage from "@/data/tokenUsage.json";

type Usage = { input: number; output: number; cacheWrite: number; cacheRead: number };

export function tokenTotals() {
  const totals = { processed: 0, written: 0 };
  for (const session of Object.values(usage.sessions as Record<string, Usage>)) {
    totals.processed += session.input + session.output + session.cacheWrite + session.cacheRead;
    totals.written += session.output;
  }
  return totals;
}

export function formatMillions(tokens: number) {
  return `${(tokens / 1_000_000).toFixed(1)} million`;
}
