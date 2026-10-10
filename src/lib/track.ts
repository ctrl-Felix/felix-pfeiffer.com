import type { TrackTarget } from "./tracking";

type Payload = { kind: "visit" } | { kind: "click"; target: TrackTarget };

const optOutKey = "notrack";
const sentClicks = new Set<string>();
let visitSent = false;

function optedOut() {
  try {
    return localStorage.getItem(optOutKey) === "1";
  } catch {
    return false;
  }
}

export function applyOptOutFromUrl() {
  try {
    const value = new URLSearchParams(window.location.search).get(optOutKey);
    if (value === null) return;
    if (value === "off") localStorage.removeItem(optOutKey);
    else localStorage.setItem(optOutKey, "1");
  } catch {}
}

function send(payload: Payload) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export function trackVisit() {
  if (visitSent || optedOut()) return;
  visitSent = true;
  send({ kind: "visit" });
}

export function trackClick(target: string) {
  if (sentClicks.has(target) || optedOut()) return;
  sentClicks.add(target);
  send({ kind: "click", target: target as TrackTarget });
}
