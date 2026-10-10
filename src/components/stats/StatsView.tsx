"use client";

import Link from "next/link";
import type { Stats } from "@/lib/stats";
import StatsBody from "./StatsBody";

export default function StatsView({ stats }: { stats: Stats | null }) {
  return (
    <div className="wallpaper fixed inset-0 overflow-y-auto text-white">
      <header className="glass fixed inset-x-3 top-3 z-10 mx-auto flex max-w-4xl items-center justify-between rounded-full px-4 py-2 text-sm">
        <Link href="/" className="font-medium">‹ Desktop</Link>
        <span className="font-semibold">Stats</span>
        <span className="w-16 text-right text-xs text-white/70">Public</span>
      </header>
      <main className="mx-auto max-w-4xl space-y-4 px-4 pb-16 pt-20">
        <div>
          <h1 className="text-3xl font-bold">Visitor statistics</h1>
          <p className="mt-1 text-white/75">Open for everyone. Anonymous and cookie free.</p>
        </div>
        <StatsBody stats={stats} tone="page" />
      </main>
    </div>
  );
}
