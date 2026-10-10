import { useCallback, useState } from "react";

export type Position = { symbol: string; shares: number; cost?: number };
export type Portfolio = { id: string; name: string; example?: boolean; positions: Position[] };

const storageKey = "stocks.portfolios";

const examples: Portfolio[] = [
  {
    id: "example-big-tech",
    name: "Big Tech",
    example: true,
    positions: [
      { symbol: "AAPL", shares: 10 },
      { symbol: "MSFT", shares: 5 },
      { symbol: "NVDA", shares: 8 },
      { symbol: "GOOGL", shares: 6 },
      { symbol: "AMZN", shares: 7 },
    ],
  },
  {
    id: "example-etf-core",
    name: "ETF Core",
    example: true,
    positions: [
      { symbol: "SPY", shares: 20 },
      { symbol: "QQQ", shares: 10 },
      { symbol: "IWM", shares: 15 },
    ],
  },
  {
    id: "example-watchlist",
    name: "Watchlist",
    example: true,
    positions: [
      { symbol: "TSLA", shares: 1 },
      { symbol: "^GSPC", shares: 1 },
      { symbol: "^GDAXI", shares: 1 },
    ],
  },
];

function isPortfolio(value: unknown): value is Portfolio {
  const item = value as Portfolio;
  return typeof item?.id === "string" && typeof item.name === "string" && Array.isArray(item.positions);
}

function load(): Portfolio[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (Array.isArray(stored) && stored.every(isPortfolio)) return stored;
  } catch {}
  return examples;
}

function save(portfolios: Portfolio[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(portfolios));
  } catch {}
}

export function usePortfolios() {
  const [portfolios, setPortfolios] = useState(load);

  const change = useCallback((update: (all: Portfolio[]) => Portfolio[]) => {
    setPortfolios((all) => {
      const next = update(all);
      save(next);
      return next;
    });
  }, []);

  const create = useCallback(
    (name: string) => {
      const id = `p-${Date.now().toString(36)}`;
      change((all) => [...all, { id, name, positions: [] }]);
      return id;
    },
    [change],
  );

  const remove = useCallback((id: string) => change((all) => all.filter((portfolio) => portfolio.id !== id)), [change]);

  const addPosition = useCallback(
    (id: string, position: Position) =>
      change((all) =>
        all.map((portfolio) =>
          portfolio.id === id
            ? { ...portfolio, positions: [...portfolio.positions.filter((item) => item.symbol !== position.symbol), position] }
            : portfolio,
        ),
      ),
    [change],
  );

  const removePosition = useCallback(
    (id: string, symbol: string) =>
      change((all) =>
        all.map((portfolio) =>
          portfolio.id === id ? { ...portfolio, positions: portfolio.positions.filter((item) => item.symbol !== symbol) } : portfolio,
        ),
      ),
    [change],
  );

  return { portfolios, create, remove, addPosition, removePosition };
}
