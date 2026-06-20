import { buildPnLCurve, findBreakevens, generatePriceRange } from '../math/curve.js';
import type { PnLPoint } from '../types.js';
import {
  type ModelerInputs,
  type ModelerResult,
  computeModelerResult,
  evaluatePortfolioAtPrice,
} from '../modeler/portfolio.js';

export interface RollAnalyzerInputs {
  stockPrice: number;
  riskFreeRate: number;
  dividendYield: number;
  before: Omit<ModelerInputs, 'stockPrice' | 'riskFreeRate' | 'dividendYield'>;
  after: Omit<ModelerInputs, 'stockPrice' | 'riskFreeRate' | 'dividendYield'>;
}

export interface RollAnalyzerResult {
  before: ModelerResult;
  after: ModelerResult;
  netRollCredit: number;
  beforeCurve: PnLPoint[];
  afterCurve: PnLPoint[];
  breakevensBefore: number[];
  breakevensAfter: number[];
}

function buildBaseInputs(
  stockPrice: number,
  riskFreeRate: number,
  dividendYield: number,
  legs: RollAnalyzerInputs['before'],
): ModelerInputs {
  return {
    stockPrice,
    riskFreeRate,
    dividendYield,
    optionLegs: legs.optionLegs,
    stockLegs: legs.stockLegs,
    daysForward: legs.daysForward,
    ivShiftPercent: legs.ivShiftPercent,
    atExpiration: legs.atExpiration,
  };
}

export function computeRollAnalyzer(inputs: RollAnalyzerInputs): RollAnalyzerResult {
  const beforeInputs = buildBaseInputs(
    inputs.stockPrice,
    inputs.riskFreeRate,
    inputs.dividendYield,
    inputs.before,
  );
  const afterInputs = buildBaseInputs(
    inputs.stockPrice,
    inputs.riskFreeRate,
    inputs.dividendYield,
    inputs.after,
  );

  const before = computeModelerResult(beforeInputs, [
    { label: 'Before', daysForward: 0, atExpiration: false },
  ]);
  const after = computeModelerResult(afterInputs, [
    { label: 'After', daysForward: 0, atExpiration: false },
  ]);

  const strikes = [
    ...beforeInputs.optionLegs.map((leg) => leg.strike),
    ...afterInputs.optionLegs.map((leg) => leg.strike),
  ];
  const { min, max } = generatePriceRange(inputs.stockPrice, strikes);

  const beforeCurve = buildPnLCurve(
    (price) => evaluatePortfolioAtPrice(beforeInputs, price),
    min,
    max,
  );
  const afterCurve = buildPnLCurve(
    (price) => evaluatePortfolioAtPrice(afterInputs, price),
    min,
    max,
  );

  const netRollCredit =
    afterInputs.optionLegs.reduce((sum, leg) => {
      const sign = leg.side === 'short' ? 1 : -1;
      return sum + sign * leg.premium * leg.quantity;
    }, 0) -
    beforeInputs.optionLegs.reduce((sum, leg) => {
      const sign = leg.side === 'short' ? 1 : -1;
      return sum + sign * leg.premium * leg.quantity;
    }, 0);

  return {
    before,
    after,
    netRollCredit,
    beforeCurve,
    afterCurve,
    breakevensBefore: findBreakevens(beforeCurve),
    breakevensAfter: findBreakevens(afterCurve),
  };
}
