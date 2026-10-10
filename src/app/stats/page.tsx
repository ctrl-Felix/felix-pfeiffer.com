import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import StatsView from "@/components/stats/StatsView";
import { getStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Visitor Statistics | Felix Pfeiffer",
  description: "Public, anonymous visitor statistics of felix-pfeiffer.com. Everything that is tracked is shown here.",
  alternates: { canonical: "/stats" },
  robots: { index: false, follow: true },
};

async function Stats() {
  await connection();
  return <StatsView stats={await getStats()} />;
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="wallpaper fixed inset-0" />}>
      <Stats />
    </Suspense>
  );
}
