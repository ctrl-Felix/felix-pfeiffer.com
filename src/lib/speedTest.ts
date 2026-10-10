export const speedTestOrigin = "https://speed.cloudflare.com";

export type Measure = { fetcher: typeof fetch; now: () => number; signal?: AbortSignal };
export type Plan = { bytes: number; runs: number }[];

export const downloadPlan: Plan = [
  { bytes: 100_000, runs: 4 },
  { bytes: 1_000_000, runs: 4 },
  { bytes: 10_000_000, runs: 3 },
  { bytes: 25_000_000, runs: 2 },
  { bytes: 50_000_000, runs: 1 },
];

export const uploadPlan: Plan = [
  { bytes: 100_000, runs: 3 },
  { bytes: 1_000_000, runs: 3 },
  { bytes: 5_000_000, runs: 2 },
  { bytes: 10_000_000, runs: 2 },
  { bytes: 25_000_000, runs: 1 },
];

const longEnoughMs = 250;
const stopAfterMs = 1500;
const budgetMs = 12_000;

export const megabitsPerSecond = (bytes: number, milliseconds: number) => (bytes * 8) / (milliseconds / 1000) / 1_000_000;

export function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function summarize(samples: { bytes: number; milliseconds: number }[]) {
  const long = samples.filter((sample) => sample.milliseconds >= longEnoughMs);
  const usable = long.length ? long : samples;
  return percentile(usable.map((sample) => megabitsPerSecond(sample.bytes, sample.milliseconds)), 0.9);
}

async function timed({ fetcher, now, signal }: Measure, url: string, init: RequestInit = {}) {
  const start = now();
  const response = await fetcher(url, { ...init, cache: "no-store", signal });
  if (!response.ok) throw new Error(`Speed test server answered ${response.status}`);
  await response.arrayBuffer();
  return now() - start;
}

export async function measureLatency(measure: Measure, samples = 8) {
  const times: number[] = [];
  for (let index = 0; index <= samples; index++) {
    times.push(await timed(measure, `${speedTestOrigin}/__down?bytes=0`));
  }
  return percentile(times.slice(1), 0.5);
}

async function measureThroughput(measure: Measure, plan: Plan, run: (bytes: number) => Promise<number>, onSample: (mbps: number) => void) {
  const samples: { bytes: number; milliseconds: number }[] = [];
  const started = measure.now();
  for (const step of plan) {
    let slowest = 0;
    for (let index = 0; index < step.runs; index++) {
      const milliseconds = await run(step.bytes);
      samples.push({ bytes: step.bytes, milliseconds });
      slowest = Math.max(slowest, milliseconds);
      onSample(summarize(samples));
      if (measure.now() - started > budgetMs) return summarize(samples);
    }
    if (slowest > stopAfterMs) break;
  }
  return summarize(samples);
}

export function measureDownload(measure: Measure, onSample: (mbps: number) => void) {
  return measureThroughput(measure, downloadPlan, (bytes) => timed(measure, `${speedTestOrigin}/__down?bytes=${bytes}`), onSample);
}

export function measureUpload(measure: Measure, onSample: (mbps: number) => void) {
  return measureThroughput(
    measure,
    uploadPlan,
    (bytes) => timed(measure, `${speedTestOrigin}/__up`, { method: "POST", body: new Uint8Array(bytes), headers: { "Content-Type": "text/plain" } }),
    onSample,
  );
}

export function formatSpeed(mbps: number) {
  if (mbps >= 100) return mbps.toFixed(0);
  if (mbps >= 10) return mbps.toFixed(1);
  return mbps.toFixed(2);
}
