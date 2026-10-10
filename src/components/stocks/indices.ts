export const indices = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^GDAXI", name: "DAX" },
  { symbol: "^FTSE", name: "FTSE 100" },
  { symbol: "^FCHI", name: "CAC 40" },
  { symbol: "^STOXX50E", name: "Euro Stoxx 50" },
  { symbol: "^SSMI", name: "SMI" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "000001.SS", name: "Shanghai Composite" },
];

export const indexSymbols = indices.map((index) => index.symbol);
