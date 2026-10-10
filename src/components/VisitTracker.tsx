"use client";

import { useEffect } from "react";
import { applyOptOutFromUrl, trackVisit } from "@/lib/track";

export default function VisitTracker() {
  useEffect(() => {
    applyOptOutFromUrl();
    trackVisit();
  }, []);

  return null;
}
