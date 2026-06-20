import type { StrategyDefinition } from './types.js';

export const STRATEGIES: StrategyDefinition[] = [
  {
    id: 'long-call',
    name: 'Long Call',
    category: 'single-leg',
    description: 'Bullish with limited risk. Profit when the stock rises.',
  },
  {
    id: 'long-put',
    name: 'Long Put',
    category: 'single-leg',
    description: 'Bearish with limited risk. Profit when the stock falls.',
  },
  {
    id: 'short-call',
    name: 'Short Call',
    category: 'single-leg',
    description: 'Bearish with unlimited risk. Profit when the stock stays flat or falls.',
  },
  {
    id: 'short-put',
    name: 'Short Put',
    category: 'single-leg',
    description: 'Bullish with substantial risk. Profit when the stock stays flat or rises.',
  },
  {
    id: 'bull-call-spread',
    name: 'Bull Call Spread',
    category: 'vertical',
    description: 'Bullish debit spread. Lower cost than a long call, capped profit.',
  },
  {
    id: 'bull-put-spread',
    name: 'Bull Put Spread',
    category: 'vertical',
    description: 'Bullish credit spread. Collect premium with defined risk.',
  },
  {
    id: 'bear-put-spread',
    name: 'Bear Put Spread',
    category: 'vertical',
    description: 'Bearish debit spread. Lower cost than a long put, capped profit.',
  },
  {
    id: 'bear-call-spread',
    name: 'Bear Call Spread',
    category: 'vertical',
    description: 'Bearish credit spread. Collect premium with defined risk.',
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    category: 'income',
    description: 'Generate income on shares you own. Capped upside, stock-like downside.',
  },
  {
    id: 'cash-secured-put',
    name: 'Cash-Secured Put',
    category: 'income',
    description: 'Get paid to wait for a stock you want. Cash secures the obligation.',
  },
  {
    id: 'pmcc',
    name: "Poor Man's Covered Call",
    category: 'income',
    description: 'Covered call alternative using a long-term call instead of shares.',
  },
  {
    id: 'straddle',
    name: 'Straddle',
    category: 'volatility',
    description: 'Bet on movement (long) or stability (short). ATM call + ATM put.',
  },
  {
    id: 'strangle',
    name: 'Strangle',
    category: 'volatility',
    description: 'Bet on movement (long) or stability (short). OTM call + OTM put.',
  },
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    category: 'volatility',
    description: 'Profit when the stock stays in a wide range. Defined risk on both sides.',
  },
  {
    id: 'iron-butterfly',
    name: 'Iron Butterfly',
    category: 'volatility',
    description: 'Profit when the stock stays in a tight range. Higher credit, tighter range.',
  },
  {
    id: 'options-pricing',
    name: 'Options Pricing',
    category: 'pricing',
    description: 'Calculate theoretical prices and Greeks using Black-Scholes.',
  },
  {
    id: 'implied-volatility',
    name: 'Implied Volatility',
    category: 'pricing',
    description: "Derive IV from an option's market price.",
  },
  {
    id: 'theta-decay',
    name: 'Theta Decay Curve',
    category: 'pricing',
    description: 'Visualize how an option loses value over time.',
  },
  {
    id: 'expected-move',
    name: 'Expected Move',
    category: 'pricing',
    description: 'Visualize the expected price range from implied volatility over any time horizon.',
  },
];

export function getStrategyById(id: string): StrategyDefinition | undefined {
  return STRATEGIES.find((strategy) => strategy.id === id);
}

export function getStrategiesByCategory(
  category: StrategyDefinition['category'],
): StrategyDefinition[] {
  return STRATEGIES.filter((strategy) => strategy.category === category);
}
