import { airlines, type Airline } from "@/data/aviation";
import { fetchQuotes, type Quote } from "./marketData";

export const fxSymbols = { GBP: "EURGBP=X", NOK: "EURNOK=X" } as const;
const fallbackRates = { GBP: 0.87, NOK: 11.7 };

export type FxRates = { GBP: number; NOK: number; live: boolean };

export type AirlineRow = Airline & {
  revenueEur: number | null;
  operatingProfitEur: number | null;
  netProfitEur: number | null;
  operatingMargin: number;
  netMargin: number | null;
  revenuePerPassengerEur: number | null;
  price: number | null;
  priceCurrency: string | null;
  dayChange: number | null;
  yearChange: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  marketCapEur: number | null;
  priceToEarnings: number | null;
  priceTime: number | null;
  history: number[];
};

export type AviationDashboard = { rows: AirlineRow[]; fx: FxRates; pricesLive: boolean; generated: string };

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;
const percent = (part: number, whole: number) => round((part / whole) * 100, 1);

export function fxRates(quotes: Record<string, Quote>): FxRates {
  const gbp = quotes[fxSymbols.GBP]?.price;
  const nok = quotes[fxSymbols.NOK]?.price;
  if (gbp && nok) return { GBP: gbp, NOK: nok, live: true };
  return { ...fallbackRates, live: false };
}

export function toEur(amount: number, currency: string, fx: FxRates) {
  if (currency === "EUR") return amount;
  if (currency === "GBP") return amount / fx.GBP;
  if (currency === "NOK") return amount / fx.NOK;
  return null;
}

export function majorUnits(price: number, currency: string) {
  return currency === "GBp" || currency === "GBX" ? { price: price / 100, currency: "GBP" } : { price, currency };
}

function change(now: number, before: number | null) {
  return before ? round((now / before - 1) * 100, 1) : null;
}

export function buildRow(airline: Airline, quote: Quote | undefined, fx: FxRates): AirlineRow {
  const revenueEur = toEur(airline.revenue, airline.currency, fx);
  const operatingProfitEur = toEur(airline.operatingProfit, airline.currency, fx);
  const netProfitEur = airline.netProfit === null ? null : toEur(airline.netProfit, airline.currency, fx);
  const listed = quote ? majorUnits(quote.price, quote.currency) : null;
  const marketCapEur = listed ? toEur(listed.price * airline.sharesMillions, listed.currency, fx) : null;
  const scale = quote && listed ? listed.price / quote.price : 1;
  return {
    ...airline,
    revenueEur: revenueEur === null ? null : round(revenueEur, 0),
    operatingProfitEur: operatingProfitEur === null ? null : round(operatingProfitEur, 0),
    netProfitEur: netProfitEur === null ? null : round(netProfitEur, 0),
    operatingMargin: percent(airline.operatingProfit, airline.revenue),
    netMargin: airline.netProfit === null ? null : percent(airline.netProfit, airline.revenue),
    revenuePerPassengerEur: revenueEur === null ? null : round(revenueEur / airline.passengers, 0),
    price: listed ? round(listed.price, 2) : null,
    priceCurrency: listed?.currency ?? null,
    dayChange: quote ? change(quote.price, quote.previousClose) : null,
    yearChange: quote ? change(quote.price, quote.yearAgo) : null,
    yearHigh: quote?.yearHigh ? round(quote.yearHigh * scale, 2) : null,
    yearLow: quote?.yearLow ? round(quote.yearLow * scale, 2) : null,
    marketCapEur: marketCapEur === null ? null : round(marketCapEur, 0),
    priceToEarnings: marketCapEur !== null && netProfitEur && netProfitEur > 0 ? round(marketCapEur / netProfitEur, 1) : null,
    priceTime: quote?.time || null,
    history: quote ? quote.history.map((value) => round(value * scale, 2)) : [],
  };
}

export function buildDashboard(quotes: Record<string, Quote>, now = new Date()): AviationDashboard {
  const fx = fxRates(quotes);
  const rows = airlines.map((airline) => buildRow(airline, quotes[airline.symbol], fx));
  return { rows, fx, pricesLive: rows.some((row) => row.price !== null), generated: now.toISOString() };
}

export async function aviationDashboard(fetcher: typeof fetch = fetch) {
  const quotes = await fetchQuotes([...airlines.map((airline) => airline.symbol), ...Object.values(fxSymbols)], fetcher);
  return buildDashboard(quotes);
}
