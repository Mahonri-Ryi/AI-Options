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

export type ChartSeriesStyle = 'theoretical' | 'expiration' | 'stock';

export interface ChartSeries {
  id: string;
  label: string;
  data: PnLPoint[];
  style: ChartSeriesStyle;
}

export type ChartMarkerType = 'current' | 'strike' | 'breakeven' | 'longStrike' | 'shortStrike';

export interface ChartMarker {
  type: ChartMarkerType;
  value: number;
  label?: string;
  color?: string;
  dashStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface MetricItem {
  label: string;
  value: string;
  variant?: 'profit' | 'loss' | 'neutral' | 'positive' | 'negative';
  secondary?: string;
  secondaryVariant?: 'profit' | 'loss' | 'neutral' | 'positive' | 'negative';
  badge?: 'ITM' | 'OTM' | 'ATM';
  note?: string;
}

export interface MetricSection {
  title?: string;
  layout: 'grid' | 'rows';
  items: MetricItem[];
}

export interface CalculatorVisualization {
  chartTitle: string;
  chartTitleShort?: string;
  chartSubtitle?: string;
  chartSeries: ChartSeries[];
  chartMarkers: ChartMarker[];
  metricSections: MetricSection[];
  chartNote?: string;
}

export interface PricingResult {
  callPrice: number;
  putPrice: number;
  callGreeks: Greeks;
  putGreeks: Greeks;
  model: 'bs' | 'crr';
}

export interface CalculatorResult {
  metrics: StrategyMetrics;
  curve: PnLPoint[];
  theoreticalCurve?: PnLPoint[];
  stockComparisonCurve?: PnLPoint[];
  chartRange?: ChartRange;
  chartAxes?: ChartAxes;
  greeks?: Greeks;
  visualization?: CalculatorVisualization;
  pricingResult?: PricingResult;
  ivConverged?: boolean;
  expectedMoveDetail?: ExpectedMoveDetail;
  expectedMoveCone?: ExpectedMoveConePoint[];
  thetaDecayDetail?: ThetaDecayDetail;
  thetaDecayChart?: ThetaDecayChartData;
}

export interface ExpectedMoveConePoint {
  dte: number;
  upper: number;
  lower: number;
  expectedMove: number;
}

export interface ExpectedMoveDetail {
  expectedMove: number;
  upperBound: number;
  lowerBound: number;
  dailyMove: number;
  weeklyMove: number;
  movePercent: number;
  probability: number;
}

export interface ThetaDecayPoint {
  dte: number;
  optionPrice: number;
  intrinsicValue: number;
  extrinsicValue: number;
  theta: number;
}

export interface ThetaDecayDetail {
  entryPrice: number;
  expirationValue: number;
  totalDecay: number;
  totalDecayPercent: number;
  currentTheta: number;
  intrinsicValue: number;
  extrinsicValue: number;
  extrinsicHalfLifeDays: number | null;
  entryDte: number;
  moneyness: 'ITM' | 'ATM' | 'OTM';
}

export interface ThetaDecayChartData {
  decayCurve: ThetaDecayPoint[];
  intrinsicLine: ThetaDecayPoint[];
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
