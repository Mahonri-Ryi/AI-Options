export interface IvScreenerEntry {
  symbol: string;
  name: string;
  stockPrice: number;
  iv30: number;
  ivRank: number;
  ivPercentile: number;
  hv20: number;
  hv60: number;
}

export interface IvScreenerFilters {
  minIvRank?: number;
  maxIvRank?: number;
  sortBy?: 'ivRank' | 'ivPercentile' | 'hv20' | 'symbol';
  sortDir?: 'asc' | 'desc';
}

const DEMO_UNIVERSE: IvScreenerEntry[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', stockPrice: 545, iv30: 14.2, ivRank: 42, ivPercentile: 38, hv20: 12.8, hv60: 13.5 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', stockPrice: 478, iv30: 18.5, ivRank: 55, ivPercentile: 52, hv20: 16.2, hv60: 17.1 },
  { symbol: 'IWM', name: 'iShares Russell 2000', stockPrice: 218, iv30: 22.1, ivRank: 61, ivPercentile: 58, hv20: 19.4, hv60: 20.2 },
  { symbol: 'AAPL', name: 'Apple Inc.', stockPrice: 198, iv30: 24.8, ivRank: 48, ivPercentile: 45, hv20: 22.1, hv60: 23.0 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', stockPrice: 425, iv30: 21.3, ivRank: 39, ivPercentile: 35, hv20: 18.7, hv60: 19.2 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', stockPrice: 128, iv30: 48.2, ivRank: 72, ivPercentile: 68, hv20: 44.5, hv60: 46.1 },
  { symbol: 'TSLA', name: 'Tesla Inc.', stockPrice: 248, iv30: 56.4, ivRank: 78, ivPercentile: 74, hv20: 52.3, hv60: 54.8 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', stockPrice: 162, iv30: 42.6, ivRank: 65, ivPercentile: 62, hv20: 38.9, hv60: 40.2 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', stockPrice: 188, iv30: 32.1, ivRank: 52, ivPercentile: 49, hv20: 28.4, hv60: 29.7 },
  { symbol: 'META', name: 'Meta Platforms', stockPrice: 512, iv30: 35.8, ivRank: 58, ivPercentile: 55, hv20: 31.2, hv60: 32.5 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', stockPrice: 175, iv30: 28.4, ivRank: 44, ivPercentile: 41, hv20: 25.6, hv60: 26.8 },
  { symbol: 'JPM', name: 'JPMorgan Chase', stockPrice: 198, iv30: 22.6, ivRank: 36, ivPercentile: 33, hv20: 19.8, hv60: 20.5 },
  { symbol: 'BAC', name: 'Bank of America', stockPrice: 38, iv30: 26.3, ivRank: 47, ivPercentile: 44, hv20: 23.1, hv60: 24.0 },
  { symbol: 'XOM', name: 'Exxon Mobil', stockPrice: 112, iv30: 24.1, ivRank: 41, ivPercentile: 39, hv20: 21.5, hv60: 22.3 },
  { symbol: 'GLD', name: 'SPDR Gold Shares', stockPrice: 228, iv30: 16.8, ivRank: 28, ivPercentile: 25, hv20: 14.2, hv60: 15.1 },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury', stockPrice: 92, iv30: 19.4, ivRank: 67, ivPercentile: 64, hv20: 17.8, hv60: 18.5 },
  { symbol: 'VIX', name: 'CBOE Volatility Index', stockPrice: 16.2, iv30: 68.5, ivRank: 22, ivPercentile: 20, hv20: 62.1, hv60: 58.4 },
  { symbol: 'COIN', name: 'Coinbase Global', stockPrice: 245, iv30: 72.3, ivRank: 82, ivPercentile: 79, hv20: 68.5, hv60: 70.2 },
  { symbol: 'PLTR', name: 'Palantir Technologies', stockPrice: 28, iv30: 58.7, ivRank: 75, ivPercentile: 71, hv20: 54.2, hv60: 56.8 },
  { symbol: 'SOFI', name: 'SoFi Technologies', stockPrice: 9.5, iv30: 64.2, ivRank: 80, ivPercentile: 76, hv20: 59.8, hv60: 61.5 },
];

export function getIvScreenerUniverse(): IvScreenerEntry[] {
  return [...DEMO_UNIVERSE];
}

export function screenIvUniverse(filters: IvScreenerFilters = {}): IvScreenerEntry[] {
  let results = getIvScreenerUniverse();

  if (filters.minIvRank != null) {
    results = results.filter((entry) => entry.ivRank >= filters.minIvRank!);
  }
  if (filters.maxIvRank != null) {
    results = results.filter((entry) => entry.ivRank <= filters.maxIvRank!);
  }

  const sortBy = filters.sortBy ?? 'ivRank';
  const sortDir = filters.sortDir ?? 'desc';
  const multiplier = sortDir === 'asc' ? 1 : -1;

  return results.sort((a, b) => {
    if (sortBy === 'symbol') {
      return multiplier * a.symbol.localeCompare(b.symbol);
    }
    return multiplier * (a[sortBy] - b[sortBy]);
  });
}
