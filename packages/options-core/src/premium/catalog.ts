export type PremiumFeatureId =
  | 'option-modeler'
  | 'iv-screener'
  | 'income-analyzer'
  | 'roll-analyzer'
  | 'trade-logger';

export interface PremiumFeatureDefinition {
  id: PremiumFeatureId;
  name: string;
  description: string;
  highlights: string[];
}

export const PREMIUM_FEATURES: PremiumFeatureDefinition[] = [
  {
    id: 'option-modeler',
    name: 'Option Modeler',
    description:
      'Build multi-leg portfolios with live P/L curves, T+ time projections, and IV shift modeling.',
    highlights: ['Multi-leg portfolios', 'T+ time modeling', 'IV shift modeling'],
  },
  {
    id: 'iv-screener',
    name: 'IV Screener',
    description:
      'Scan stocks and ETFs by IV rank, IV percentile, and historical volatility trends.',
    highlights: ['IV rank & percentile', 'HV trends', 'Sortable universe'],
  },
  {
    id: 'income-analyzer',
    name: 'Income Analyzers',
    description:
      'Surface cash-secured put and covered call opportunities by yield and probability of profit.',
    highlights: ['CSP screening', 'Covered call screening', 'Yield & POP filters'],
  },
  {
    id: 'roll-analyzer',
    name: 'Roll Analyzer',
    description:
      'Compare before-and-after P/L curves when rolling options to new strikes or expirations.',
    highlights: ['Before/after curves', 'Net credit/debit', 'Strike comparison'],
  },
  {
    id: 'trade-logger',
    name: 'Trade Logger',
    description:
      'Log open and closed trades to track running P/L across wheels, covered calls, and spreads.',
    highlights: ['Open & closed trades', 'Running P/L', 'Strategy tags'],
  },
];

export const TRIAL_DURATION_DAYS = 7;

export function getPremiumFeatureById(id: string): PremiumFeatureDefinition | undefined {
  return PREMIUM_FEATURES.find((feature) => feature.id === id);
}
