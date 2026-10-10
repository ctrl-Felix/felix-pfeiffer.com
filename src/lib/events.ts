import { db } from "./db";
import type { TrafficSource } from "./trafficSources";
import type { McpTarget, TrackTarget } from "./tracking";

export async function recordVisit(visitor: string, source: TrafficSource, landing: string) {
  await db().query("insert into events (kind, visitor, source, landing) values ('visit', $1, $2, $3) on conflict do nothing", [visitor, source, landing]);
}

export async function recordClick(target: TrackTarget, visitor: string) {
  await db().query("insert into events (kind, target, visitor) values ('click', $1, $2) on conflict do nothing", [target, visitor]);
}

export async function recordMcpCall(tool: McpTarget) {
  await db().query("insert into events (kind, target) values ('mcp', $1)", [tool]);
}
