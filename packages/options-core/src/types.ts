export type OptionType = 'call' | 'put';
export type PositionSide = 'long' | 'short';
export type CalculationMode = 'iv' | 'price';

export interface MarketInputs {
  stockPrice: number;
  riskFreeRate: number;
  dividendYield: number;
  dte: number;
}

export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionLeg {
  type: OptionType;
  side: PositionSide;
  strike: number;
  quantity: number;
  premium: number;
}

export interface StockLeg {
  side: PositionSide;
  quantity: number;
  costBasis: number;
}

export interface PnLPoint {
  stockPrice: number;
  pnl: number;
  theoreticalValue?: number;
}

export interface ChartRange {
  min: number;
  max: number;
}

export interface ChartAxes {
  xTicks: number[];
  yTicks: number[];
  yDomain: [number, number];
}

export interface StrategyMetrics {
  maxProfit: number | 'unlimited';
  maxLoss: number | 'unlimited';
  breakevens: number[];
  netPremium: number;
  premium: number;
  greeks?: Greeks;
}

export interface CalculatorResult {
  metrics: StrategyMetrics;
  curve: PnLPoint[];
  theoreticalCurve?: PnLPoint[];
  chartRange?: ChartRange;
  chartAxes?: ChartAxes;
  greeks?: Greeks;
}

export type StrategyId =
  | 'long-call'
  | 'long-put'
  | 'short-call'
  | 'short-put'
  | 'bull-call-spread'
  | 'bull-put-spread'
  | 'bear-put-spread'
  | 'bear-call-spread'
  | 'covered-call'
  | 'cash-secured-put'
  | 'pmcc'
  | 'straddle'
  | 'strangle'
  | 'iron-condor'
  | 'iron-butterfly'
  | 'options-pricing'
  | 'implied-volatility'
  | 'theta-decay'
  | 'expected-move';

export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  category: 'single-leg' | 'vertical' | 'income' | 'volatility' | 'pricing';
  description: string;
}
