import { db } from "./db";
import type { TrackTarget } from "./tracking";

export async function recordVisit(visitor: string) {
  await db().query("insert into events (kind, visitor) values ('visit', $1) on conflict do nothing", [visitor]);
}

export async function recordClick(target: TrackTarget, visitor: string) {
  await db().query("insert into events (kind, target, visitor) values ('click', $1, $2) on conflict do nothing", [target, visitor]);
}
