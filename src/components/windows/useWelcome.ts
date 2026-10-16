"use client";

import { useEffect, useSyncExternalStore } from "react";
import { welcomeKey } from "@/components/welcome";

function readSeen() {
  try {
    return localStorage.getItem(welcomeKey) !== null;
  } catch {
    return false;
  }
}

const seenOnLoad = typeof window !== "undefined" && readSeen();
const noSubscription = () => () => {};

export function useWelcomeSeen(welcome: string | undefined) {
  useEffect(() => {
    if (!welcome) return;
    try {
      localStorage.setItem(welcomeKey, "1");
    } catch {}
  }, [welcome]);
  return useSyncExternalStore(noSubscription, () => seenOnLoad, () => false);
}
