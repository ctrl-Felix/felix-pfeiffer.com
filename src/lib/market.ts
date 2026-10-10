import * as placeholder from "./placeholderMarket";
import type { ChartData, Quote, RangeKey, SearchHit } from "./stocks";

type MarketProvider = {
  getQuotes: (symbols: string[]) => Promise<Quote[]>;
  getChart: (symbol: string, range: RangeKey) => Promise<ChartData>;
  searchSymbols: (query: string) => Promise<SearchHit[]>;
};

const provider: MarketProvider = placeholder;

export const getQuotes = provider.getQuotes;
export const getChart = provider.getChart;
export const searchSymbols = provider.searchSymbols;
