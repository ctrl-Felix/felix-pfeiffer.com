import assert from "node:assert/strict";
import { test } from "node:test";
import { measureDownload, measureLatency, measureUpload, megabitsPerSecond, percentile, speedTestOrigin, summarize, type Measure } from "./speedTest";

function fakeNetwork(mbps: number, latencyMs: number) {
  let clock = 0;
  const urls: string[] = [];
  const measure: Measure = {
    now: () => clock,
    fetcher: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      urls.push(url);
      const bytes = init?.body instanceof Uint8Array ? init.body.byteLength : Number(new URL(url).searchParams.get("bytes") ?? 0);
      clock += latencyMs + (bytes * 8) / (mbps * 1000);
      return new Response(new Uint8Array(0));
    }) as typeof fetch,
  };
  return { measure, urls };
}

test("speed math", () => {
  assert.equal(megabitsPerSecond(1_000_000, 1000), 8);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([], 0.9), 0);
  assert.equal(summarize([{ bytes: 1000, milliseconds: 10 }, { bytes: 1_000_000, milliseconds: 1000 }]), 8);
});

test("latency drops the first warm up request and takes the median", async () => {
  const { measure, urls } = fakeNetwork(100, 20);
  assert.equal(await measureLatency(measure), 20);
  assert.ok(urls.every((url) => url === `${speedTestOrigin}/__down?bytes=0`));
});

test("download and upload come close to the real speed and stop on slow lines", async () => {
  const fast = fakeNetwork(200, 15);
  const download = await measureDownload(fast.measure, () => {});
  assert.ok(download > 180 && download <= 200, `download ${download}`);

  const slow = fakeNetwork(5, 40);
  const samples: number[] = [];
  const upload = await measureUpload(slow.measure, (value) => samples.push(value));
  assert.ok(upload > 4 && upload <= 5, `upload ${upload}`);
  assert.ok(samples.length > 0);
  assert.ok(slow.urls.every((url) => url === `${speedTestOrigin}/__up`));
  assert.ok(slow.urls.length < 9, "a slow line does not try the biggest sizes");
});

test("a failing server rejects so the window can show an error", async () => {
  const measure: Measure = { now: () => 0, fetcher: (async () => new Response("no", { status: 503 })) as typeof fetch };
  await assert.rejects(measureLatency(measure));
});
