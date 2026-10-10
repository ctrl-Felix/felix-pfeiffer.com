import { useEffect, useState } from "react";
import type { ChartData, RangeKey } from "@/lib/stocks";
import { fetchChart } from "./api";

type Result = { key: string; data?: ChartData; failed?: boolean };

export function useChart(symbol: string, range: RangeKey) {
  const key = `${symbol}|${range}`;
  const [result, setResult] = useState<Result>({ key: "" });

  useEffect(() => {
    const controller = new AbortController();
    fetchChart(symbol, range, controller.signal)
      .then((data) => setResult({ key, data }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, failed: true });
      });
    return () => controller.abort();
  }, [symbol, range, key]);

  const current = result.key === key ? result : undefined;
  const staleData = result.data?.symbol.toUpperCase() === symbol.toUpperCase() ? result.data : undefined;
  return { data: current?.data ?? staleData, loading: !current, failed: current?.failed ?? false };
}
