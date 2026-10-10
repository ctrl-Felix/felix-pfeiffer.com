import { useEffect, useState } from "react";
import type { Quote } from "@/lib/stocks";
import { fetchQuotes } from "./api";

type Result = { key: string; quotes: Record<string, Quote>; failed: boolean };

const refreshMs = 60_000;

export function useQuotes(symbols: string[]) {
  const key = symbols.join(",");
  const [result, setResult] = useState<Result>({ key: "", quotes: {}, failed: false });

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const load = () =>
      fetchQuotes(key.split(","), controller.signal)
        .then((quotes) => setResult({ key, quotes, failed: false }))
        .catch(() => {
          if (!controller.signal.aborted) setResult((previous) => ({ key, quotes: previous.quotes, failed: true }));
        });
    load();
    const timer = setInterval(load, refreshMs);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [key]);

  return { quotes: result.quotes, loading: key !== "" && result.key !== key, failed: result.key === key && result.failed };
}
