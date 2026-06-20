import { blackScholesCall, blackScholesPut } from '../math/black-scholes.js';
import { normalCdf } from '../math/normal.js';

export type IncomeStrategyType = 'cash-secured-put' | 'covered-call';

export interface IncomeOpportunity {
  symbol: string;
  name: string;
  strategy: IncomeStrategyType;
  stockPrice: number;
  strike: number;
  dte: number;
  iv: number;
  premium: number;
  annualizedYield: number;
  probabilityOfProfit: number;
  breakeven: number;
  collateral: number;
}

export interface IncomeScreenerFilters {
  strategy?: IncomeStrategyType;
  minYield?: number;
  minPop?: number;
  sortBy?: 'annualizedYield' | 'probabilityOfProfit' | 'symbol';
  sortDir?: 'asc' | 'desc';
}

interface IncomeTicker {
  symbol: string;
  name: string;
  stockPrice: number;
  iv: number;
}

const INCOME_TICKERS: IncomeTicker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', stockPrice: 198, iv: 24.8 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', stockPrice: 425, iv: 21.3 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', stockPrice: 162, iv: 42.6 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', stockPrice: 128, iv: 48.2 },
  { symbol: 'TSLA', name: 'Tesla Inc.', stockPrice: 248, iv: 56.4 },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', stockPrice: 545, iv: 14.2 },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', stockPrice: 478, iv: 18.5 },
  { symbol: 'IWM', name: 'iShares Russell 2000', stockPrice: 218, iv: 22.1 },
  { symbol: 'BAC', name: 'Bank of America', stockPrice: 38, iv: 26.3 },
  { symbol: 'SOFI', name: 'SoFi Technologies', stockPrice: 9.5, iv: 64.2 },
];

const DEFAULT_DTE = 30;
const RISK_FREE_RATE = 4.5;

function probabilityOtmPut(stockPrice: number, strike: number, dte: number, iv: number): number {
  const timeYears = dte / 365;
  const sigma = iv / 100;
  const rate = RISK_FREE_RATE / 100;
  const d2 =
    (Math.log(stockPrice / strike) + (rate - 0.5 * sigma * sigma) * timeYears) /
    (sigma * Math.sqrt(timeYears));
  return normalCdf(d2);
}

function probabilityOtmCall(stockPrice: number, strike: number, dte: number, iv: number): number {
  return 1 - probabilityOtmPut(stockPrice, strike, dte, iv);
}

function buildCspOpportunity(ticker: IncomeTicker): IncomeOpportunity {
  const strike = Number((ticker.stockPrice * 0.95).toFixed(2));
  const premium = blackScholesPut(
    ticker.stockPrice,
    strike,
    DEFAULT_DTE,
    ticker.iv,
    RISK_FREE_RATE,
  );
  const collateral = strike * 100;
  const annualizedYield = (premium / strike) * (365 / DEFAULT_DTE) * 100;
  const pop = probabilityOtmPut(ticker.stockPrice, strike, DEFAULT_DTE, ticker.iv) * 100;

  return {
    symbol: ticker.symbol,
    name: ticker.name,
    strategy: 'cash-secured-put',
    stockPrice: ticker.stockPrice,
    strike,
    dte: DEFAULT_DTE,
    iv: ticker.iv,
    premium,
    annualizedYield,
    probabilityOfProfit: pop,
    breakeven: strike - premium,
    collateral,
  };
}

function buildCcOpportunity(ticker: IncomeTicker): IncomeOpportunity {
  const strike = Number((ticker.stockPrice * 1.05).toFixed(2));
  const premium = blackScholesCall(
    ticker.stockPrice,
    strike,
    DEFAULT_DTE,
    ticker.iv,
    RISK_FREE_RATE,
  );
  const collateral = ticker.stockPrice * 100;
  const annualizedYield = (premium / ticker.stockPrice) * (365 / DEFAULT_DTE) * 100;
  const pop = probabilityOtmCall(ticker.stockPrice, strike, DEFAULT_DTE, ticker.iv) * 100;

  return {
    symbol: ticker.symbol,
    name: ticker.name,
    strategy: 'covered-call',
    stockPrice: ticker.stockPrice,
    strike,
    dte: DEFAULT_DTE,
    iv: ticker.iv,
    premium,
    annualizedYield,
    probabilityOfProfit: pop,
    breakeven: ticker.stockPrice - premium,
    collateral,
  };
}

export function getIncomeOpportunities(filters: IncomeScreenerFilters = {}): IncomeOpportunity[] {
  const strategies: IncomeStrategyType[] = filters.strategy
    ? [filters.strategy]
    : ['cash-secured-put', 'covered-call'];

  let results: IncomeOpportunity[] = [];

  for (const ticker of INCOME_TICKERS) {
    if (strategies.includes('cash-secured-put')) {
      results.push(buildCspOpportunity(ticker));
    }
    if (strategies.includes('covered-call')) {
      results.push(buildCcOpportunity(ticker));
    }
  }

  if (filters.minYield != null) {
    results = results.filter((opp) => opp.annualizedYield >= filters.minYield!);
  }
  if (filters.minPop != null) {
    results = results.filter((opp) => opp.probabilityOfProfit >= filters.minPop!);
  }

  const sortBy = filters.sortBy ?? 'annualizedYield';
  const sortDir = filters.sortDir ?? 'desc';
  const multiplier = sortDir === 'asc' ? 1 : -1;

  return results.sort((a, b) => {
    if (sortBy === 'symbol') {
      return multiplier * a.symbol.localeCompare(b.symbol);
    }
    return multiplier * (a[sortBy] - b[sortBy]);
  });
}
