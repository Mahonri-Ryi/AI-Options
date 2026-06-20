export type TradeStatus = 'open' | 'closed';

export interface LoggedTrade {
  id: string;
  symbol: string;
  strategy: string;
  status: TradeStatus;
  openedAt: string;
  closedAt?: string;
  quantity: number;
  entryPremium: number;
  exitPremium?: number;
  notes?: string;
}

export interface TradeLoggerSummary {
  openCount: number;
  closedCount: number;
  realizedPnl: number;
  openPremiumCollected: number;
  trades: LoggedTrade[];
}

export function computeTradePnl(trade: LoggedTrade): number | null {
  if (trade.status !== 'closed' || trade.exitPremium == null) return null;
  return (trade.entryPremium - trade.exitPremium) * trade.quantity * 100;
}

export function summarizeTrades(trades: LoggedTrade[]): TradeLoggerSummary {
  const open = trades.filter((trade) => trade.status === 'open');
  const closed = trades.filter((trade) => trade.status === 'closed');

  const realizedPnl = closed.reduce((sum, trade) => {
    const pnl = computeTradePnl(trade);
    return sum + (pnl ?? 0);
  }, 0);

  const openPremiumCollected = open.reduce(
    (sum, trade) => sum + trade.entryPremium * trade.quantity * 100,
    0,
  );

  return {
    openCount: open.length,
    closedCount: closed.length,
    realizedPnl,
    openPremiumCollected,
    trades: [...trades].sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
  };
}

export const DEMO_TRADES: LoggedTrade[] = [
  {
    id: '1',
    symbol: 'AAPL',
    strategy: 'Cash-Secured Put',
    status: 'closed',
    openedAt: '2025-05-01',
    closedAt: '2025-05-28',
    quantity: 1,
    entryPremium: 2.45,
    exitPremium: 0.35,
    notes: 'Closed at 85% profit',
  },
  {
    id: '2',
    symbol: 'SPY',
    strategy: 'Iron Condor',
    status: 'closed',
    openedAt: '2025-04-15',
    closedAt: '2025-05-10',
    quantity: 2,
    entryPremium: 1.85,
    exitPremium: 0.9,
  },
  {
    id: '3',
    symbol: 'AMD',
    strategy: 'Covered Call',
    status: 'open',
    openedAt: '2025-06-01',
    quantity: 1,
    entryPremium: 3.2,
    notes: 'June 20 expiration',
  },
  {
    id: '4',
    symbol: 'SOFI',
    strategy: 'Wheel - CSP',
    status: 'open',
    openedAt: '2025-06-10',
    quantity: 3,
    entryPremium: 0.42,
  },
];
