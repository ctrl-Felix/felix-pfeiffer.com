"use client";

import { useEffect, useState } from "react";
import type { Stats } from "@/lib/stats";

type State = { loaded: boolean; stats: Stats | null };

export function useStats() {
  const [state, setState] = useState<State>({ loaded: false, stats: null });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((stats: Stats | null) => setState({ loaded: true, stats }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ loaded: true, stats: null });
      });
    return () => controller.abort();
  }, []);

  return state;
}
