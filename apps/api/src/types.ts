export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

export interface OptionContract {
  symbol: string;
  underlying: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  mid: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionChain {
  underlying: string;
  underlyingPrice: number;
  updatedAt: string;
  contracts: OptionContract[];
}

export interface MarketDataProvider {
  getQuote(symbol: string): Promise<Quote>;
  getOptionChain(symbol: string, expiration?: string): Promise<OptionChain>;
  searchSymbols(query: string): Promise<Array<{ symbol: string; name: string }>>;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}
