import {
  aggregateGreeks,
  buildPnLCurve,
  evaluateOptionLeg,
  evaluateStockLeg,
  findBreakevens,
  generatePriceRange,
  legGreeks,
} from '../math/curve.js';
import type { Greeks, OptionLeg, PnLPoint, StockLeg, StrategyMetrics } from '../types.js';

export interface ModelerOptionLeg extends OptionLeg {
  dte: number;
  ivPercent: number;
}

export interface ModelerStockLeg extends StockLeg {}

export interface ModelerInputs {
  stockPrice: number;
  riskFreeRate: number;
  dividendYield: number;
  optionLegs: ModelerOptionLeg[];
  stockLegs: ModelerStockLeg[];
  daysForward?: number;
  ivShiftPercent?: number;
  atExpiration?: boolean;
}

export interface ModelerCurve {
  label: string;
  daysForward: number;
  atExpiration: boolean;
  curve: PnLPoint[];
}

export interface ModelerResult {
  metrics: StrategyMetrics;
  curves: ModelerCurve[];
  greeks?: Greeks;
}

function effectiveDte(legDte: number, daysForward: number, atExpiration: boolean): number {
  if (atExpiration) return 0;
  return Math.max(0, legDte - daysForward);
}

function effectiveIv(ivPercent: number, ivShiftPercent: number): number {
  return Math.max(0.01, ivPercent + ivShiftPercent);
}

export function evaluatePortfolioAtPrice(inputs: ModelerInputs, stockPrice: number): number {
  const daysForward = inputs.daysForward ?? 0;
  const ivShift = inputs.ivShiftPercent ?? 0;
  const atExpiration = inputs.atExpiration ?? false;

  let total = 0;

  for (const leg of inputs.stockLegs) {
    total += evaluateStockLeg(leg, stockPrice);
  }

  for (const leg of inputs.optionLegs) {
    const dte = effectiveDte(leg.dte, daysForward, atExpiration);
    const iv = effectiveIv(leg.ivPercent, ivShift);
    total += evaluateOptionLeg(
      leg,
      stockPrice,
      atExpiration,
      dte,
      iv,
      inputs.riskFreeRate,
      inputs.dividendYield,
    );
  }

  return total;
}

export function computeModelerResult(
  inputs: ModelerInputs,
  curveConfigs?: Array<{ label: string; daysForward: number; atExpiration?: boolean }>,
): ModelerResult {
  const strikes = inputs.optionLegs.map((leg) => leg.strike);
  const { min, max } = generatePriceRange(inputs.stockPrice, strikes);

  const defaultConfigs =
    curveConfigs ??
    [
      { label: 'T+0', daysForward: 0, atExpiration: false },
      { label: 'T+50%', daysForward: Math.round(Math.max(...inputs.optionLegs.map((l) => l.dte), 1) / 2), atExpiration: false },
      { label: 'Expiration', daysForward: 0, atExpiration: true },
    ];

  const curves: ModelerCurve[] = defaultConfigs.map((config) => {
    const curveInputs: ModelerInputs = {
      ...inputs,
      daysForward: config.daysForward,
      atExpiration: config.atExpiration ?? false,
    };

    return {
      label: config.label,
      daysForward: config.daysForward,
      atExpiration: config.atExpiration ?? false,
      curve: buildPnLCurve(
        (price) => evaluatePortfolioAtPrice(curveInputs, price),
        min,
        max,
      ),
    };
  });

  const primaryCurve = curves[0]?.curve ?? [];
  const breakevens = findBreakevens(primaryCurve);

  const greeks =
    inputs.optionLegs.length > 0
      ? aggregateGreeks(
          inputs.optionLegs,
          inputs.optionLegs.map((leg) =>
            legGreeks(
              leg,
              inputs.stockPrice,
              effectiveDte(leg.dte, inputs.daysForward ?? 0, false),
              effectiveIv(leg.ivPercent, inputs.ivShiftPercent ?? 0),
              inputs.riskFreeRate,
              inputs.dividendYield,
            ),
          ),
        )
      : undefined;

  const netPremium = inputs.optionLegs.reduce((sum, leg) => {
    const sign = leg.side === 'short' ? 1 : -1;
    return sum + sign * leg.premium * leg.quantity;
  }, 0);

  const pnls = primaryCurve.map((point) => point.pnl);
  const maxProfit = Math.max(...pnls);
  const maxLoss = Math.min(...pnls);

  return {
    metrics: {
      maxProfit,
      maxLoss,
      breakevens,
      netPremium,
      premium: Math.abs(netPremium),
      greeks,
    },
    curves,
    greeks,
  };
}
