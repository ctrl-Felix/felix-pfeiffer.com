"use client";

import { useEffect, useState } from "react";
import type { AviationDashboard } from "@/lib/aviationDashboard";

export type AviationState = { kind: "loading" } | { kind: "error" } | { kind: "done"; data: AviationDashboard };

export function useAviation() {
  const [state, setState] = useState<AviationState>({ kind: "loading" });
  useEffect(() => {
    let active = true;
    fetch("/api/analyst/aviation")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("failed"))))
      .then((data: AviationDashboard) => active && setState({ kind: "done", data }))
      .catch(() => active && setState({ kind: "error" }));
    return () => {
      active = false;
    };
  }, []);
  return state;
}
