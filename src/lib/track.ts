import type { TrackTarget } from "./tracking";

type Payload = { kind: "visit" } | { kind: "click"; target: TrackTarget };

export function track(payload: Payload) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export const trackClick = (target: string) => track({ kind: "click", target: target as TrackTarget });
