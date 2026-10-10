import type { Quote } from "@/lib/stocks";
import type { Portfolio } from "./portfolios";

export type Totals = {
  currency: string | null;
  value: number;
  dayChange: number;
  dayPercent: number;
  gain: number | null;
  gainPercent: number | null;
  complete: boolean;
};

export function portfolioTotals(portfolio: Portfolio, quotes: Record<string, Quote>): Totals {
  const priced = portfolio.positions.flatMap((position) => {
    const quote = quotes[position.symbol];
    return quote ? [{ position, quote }] : [];
  });
  const currencies = new Set(priced.map(({ quote }) => quote.currency));
  const currency = currencies.size === 1 ? [...currencies][0] : null;
  const value = priced.reduce((sum, { position, quote }) => sum + position.shares * quote.price, 0);
  const dayChange = priced.reduce((sum, { position, quote }) => sum + position.shares * (quote.price - quote.baseline), 0);
  const previous = value - dayChange;
  const hasCosts = priced.length > 0 && priced.every(({ position }) => position.cost !== undefined);
  const cost = priced.reduce((sum, { position }) => sum + position.shares * (position.cost ?? 0), 0);
  return {
    currency,
    value,
    dayChange,
    dayPercent: previous ? (dayChange / previous) * 100 : 0,
    gain: hasCosts ? value - cost : null,
    gainPercent: hasCosts && cost ? ((value - cost) / cost) * 100 : null,
    complete: priced.length === portfolio.positions.length && priced.length > 0,
  };
}
