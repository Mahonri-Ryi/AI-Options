import type { MarketDataProvider, OptionChain, OptionContract, Quote } from '../types.js';

interface PolygonSnapshotResult {
  results?: Array<{
    details: {
      ticker: string;
      strike_price: number;
      expiration_date: string;
      contract_type: string;
    };
    greeks?: {
      delta?: number;
      gamma?: number;
      theta?: number;
      vega?: number;
    };
    implied_volatility?: number;
    day?: { volume?: number; open_interest?: number };
    last_quote?: { bid?: number; ask?: number; midpoint?: number };
    last_trade?: { price?: number };
  }>;
}

interface PolygonTickerResult {
  results?: {
    value?: number;
    change?: number;
    change_percent?: number;
  };
}

/**
 * Polygon.io is the recommended provider for US options chains at scale.
 * projectoption.com proxies live data through api.projectoption.com (Supabase auth),
 * almost certainly sourcing from a commercial feed like Polygon or similar.
 */
export class PolygonProvider implements MarketDataProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = 'https://api.polygon.io',
  ) {}

  private async fetchJson<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('apiKey', this.apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Polygon API error ${response.status} for ${path}`);
    }
    return response.json() as Promise<T>;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const data = await this.fetchJson<PolygonTickerResult>(
      `/v2/snapshot/locale/us/markets/stocks/tickers/${symbol.toUpperCase()}`,
    );

    return {
      symbol: symbol.toUpperCase(),
      price: data.results?.value ?? 0,
      change: data.results?.change ?? 0,
      changePercent: data.results?.change_percent ?? 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async getOptionChain(symbol: string, expiration?: string): Promise<OptionChain> {
    const params: Record<string, string> = { limit: '250' };
    if (expiration) params['expiration_date'] = expiration;

    const [chain, quote] = await Promise.all([
      this.fetchJson<PolygonSnapshotResult>(`/v3/snapshot/options/${symbol.toUpperCase()}`, params),
      this.getQuote(symbol),
    ]);

    const contracts: OptionContract[] = (chain.results ?? []).map((item) => {
      const bid = item.last_quote?.bid ?? 0;
      const ask = item.last_quote?.ask ?? 0;
      const mid = item.last_quote?.midpoint ?? (bid && ask ? (bid + ask) / 2 : 0);

      return {
        symbol: item.details.ticker,
        underlying: symbol.toUpperCase(),
        strike: item.details.strike_price,
        expiration: item.details.expiration_date,
        type: item.details.contract_type === 'put' ? 'put' : 'call',
        bid,
        ask,
        mid,
        last: item.last_trade?.price ?? mid,
        volume: item.day?.volume ?? 0,
        openInterest: item.day?.open_interest ?? 0,
        impliedVolatility: (item.implied_volatility ?? 0) * 100,
        delta: item.greeks?.delta ?? 0,
        gamma: item.greeks?.gamma ?? 0,
        theta: item.greeks?.theta ?? 0,
        vega: item.greeks?.vega ?? 0,
      };
    });

    return {
      underlying: symbol.toUpperCase(),
      underlyingPrice: quote.price,
      updatedAt: new Date().toISOString(),
      contracts,
    };
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string }>> {
    const data = await this.fetchJson<{
      results?: Array<{ ticker: string; name: string }>;
    }>('/v3/reference/tickers', {
      search: query,
      active: 'true',
      market: 'stocks',
      limit: '20',
    });

    return (data.results ?? []).map((item) => ({
      symbol: item.ticker,
      name: item.name,
    }));
  }
}

export class MockMarketDataProvider implements MarketDataProvider {
  async getQuote(symbol: string): Promise<Quote> {
    return {
      symbol: symbol.toUpperCase(),
      price: 185.42,
      change: 2.15,
      changePercent: 1.17,
      updatedAt: new Date().toISOString(),
    };
  }

  async getOptionChain(symbol: string): Promise<OptionChain> {
    const quote = await this.getQuote(symbol);
    const strikes = [170, 175, 180, 185, 190, 195, 200];
    const expiration = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const contracts: OptionContract[] = [];

    for (const strike of strikes) {
      for (const type of ['call', 'put'] as const) {
        const distance = Math.abs(quote.price - strike);
        const mid = Math.max(0.5, 8 - distance * 0.4);
        contracts.push({
          symbol: `O:${symbol}${expiration.replace(/-/g, '')}${type === 'call' ? 'C' : 'P'}${String(strike * 1000).padStart(8, '0')}`,
          underlying: symbol.toUpperCase(),
          strike,
          expiration,
          type,
          bid: mid - 0.05,
          ask: mid + 0.05,
          mid,
          last: mid,
          volume: 1200,
          openInterest: 4500,
          impliedVolatility: 28 + distance * 0.2,
          delta: type === 'call' ? 0.55 : -0.45,
          gamma: 0.02,
          theta: -0.08,
          vega: 0.15,
        });
      }
    }

    return {
      underlying: symbol.toUpperCase(),
      underlyingPrice: quote.price,
      updatedAt: new Date().toISOString(),
      contracts,
    };
  }

  async searchSymbols(query: string): Promise<Array<{ symbol: string; name: string }>> {
    const universe = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corporation' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation' },
      { symbol: 'TSLA', name: 'Tesla, Inc.' },
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
    ];
    return universe.filter(
      (item) =>
        item.symbol.includes(query.toUpperCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase()),
    );
  }
}

export function createMarketDataProvider(): MarketDataProvider {
  const apiKey = process.env.POLYGON_API_KEY;
  if (apiKey) {
    return new PolygonProvider(apiKey);
  }
  return new MockMarketDataProvider();
}
