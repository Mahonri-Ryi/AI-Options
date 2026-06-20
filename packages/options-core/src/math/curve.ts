import type { ChartAxes, ChartRange, Greeks, OptionLeg, PnLPoint, StockLeg } from '../types.js';
import {
  buildStockPricePoints,
  chartYDomain,
  nicePnlTicks,
  nicePriceTicks,
  type PriceRange,
} from './chart-range.js';
import { calculateGreeks, optionPrice, pnlAtExpiration } from './black-scholes.js';

const CONTRACT_MULTIPLIER = 100;

export interface CurveOptions {
  minPrice?: number;
  maxPrice?: number;
  points?: number;
  atExpiration?: boolean;
  dte?: number;
  ivPercent?: number;
  riskFreeRatePercent?: number;
  dividendYieldPercent?: number;
}

export function generatePriceRange(
  stockPrice: number,
  strikes: number[],
  paddingPercent = 0.3,
): { min: number; max: number } {
  const allPrices = [stockPrice, ...strikes];
  const minStrike = Math.min(...allPrices);
  const maxStrike = Math.max(...allPrices);
  const span = Math.max(maxStrike - minStrike, stockPrice * 0.2);
  const padding = Math.max(span * paddingPercent, stockPrice * 0.35);
  return {
    min: Math.max(0.01, minStrike - padding),
    max: maxStrike + padding,
  };
}

export function buildPnLCurve(
  evaluate: (stockPrice: number) => number,
  minPrice: number,
  maxPrice: number,
  points = 120,
): PnLPoint[] {
  const step = (maxPrice - minPrice) / (points - 1);
  const curve: PnLPoint[] = [];

  for (let i = 0; i < points; i++) {
    const stockPrice = minPrice + step * i;
    curve.push({
      stockPrice: Number(stockPrice.toFixed(4)),
      pnl: Number(evaluate(stockPrice).toFixed(2)),
    });
  }

  return curve;
}

export function buildSteppedCurves(
  range: PriceRange,
  step: number,
  evaluateExpiration: (stockPrice: number) => number,
  evaluateTheoretical?: (stockPrice: number) => number,
): { expirationCurve: PnLPoint[]; theoreticalCurve: PnLPoint[] } {
  const prices = buildStockPricePoints(range, step);
  const expirationCurve = prices.map((stockPrice) => ({
    stockPrice,
    pnl: Number(evaluateExpiration(stockPrice).toFixed(2)),
  }));
  const theoreticalCurve = prices.map((stockPrice) => ({
    stockPrice,
    pnl: Number((evaluateTheoretical ?? evaluateExpiration)(stockPrice).toFixed(2)),
  }));
  return { expirationCurve, theoreticalCurve };
}

export function buildChartAxes(
  range: PriceRange,
  expirationCurve: PnLPoint[],
  theoreticalCurve?: PnLPoint[],
): ChartAxes {
  const curves = theoreticalCurve ? [expirationCurve, theoreticalCurve] : [expirationCurve];
  const yDomain = chartYDomain(curves);
  return {
    xTicks: nicePriceTicks(range.min, range.max),
    yTicks: nicePnlTicks(yDomain[0], yDomain[1]),
    yDomain,
  };
}

export function analyticalBreakeven(
  type: 'call' | 'put',
  side: 'long' | 'short',
  strike: number,
  premium: number,
): number {
  if (side === 'long') {
    return type === 'call' ? strike + premium : strike - premium;
  }
  return type === 'call' ? strike + premium : strike - premium;
}

export function spreadBreakeven(
  longStrike: number,
  shortStrike: number,
  netDebit: number,
  type: 'call' | 'put',
): number {
  return type === 'call' ? longStrike + netDebit : longStrike - netDebit;
}

export function evaluateOptionLeg(
  leg: OptionLeg,
  stockPrice: number,
  atExpiration: boolean,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent: number,
): number {
  if (atExpiration || dte <= 0) {
    return pnlAtExpiration(
      leg.type,
      leg.side,
      stockPrice,
      leg.strike,
      leg.premium,
      leg.quantity,
      CONTRACT_MULTIPLIER,
    );
  }

  const theoretical = optionPrice(
    leg.type,
    stockPrice,
    leg.strike,
    dte,
    ivPercent,
    riskFreeRatePercent,
    dividendYieldPercent,
  );

  const value = leg.side === 'long' ? theoretical - leg.premium : leg.premium - theoretical;
  return value * leg.quantity * CONTRACT_MULTIPLIER;
}

export function evaluateStockLeg(
  leg: StockLeg,
  stockPrice: number,
): number {
  const direction = leg.side === 'long' ? 1 : -1;
  return direction * (stockPrice - leg.costBasis) * leg.quantity * CONTRACT_MULTIPLIER;
}

export function aggregateGreeks(legs: OptionLeg[], greeksList: Greeks[]): Greeks {
  return greeksList.reduce(
    (acc, greeks, index) => {
      const sign = legs[index].side === 'long' ? 1 : -1;
      const qty = legs[index].quantity;
      return {
        delta: acc.delta + sign * greeks.delta * qty,
        gamma: acc.gamma + sign * greeks.gamma * qty,
        theta: acc.theta + sign * greeks.theta * qty,
        vega: acc.vega + sign * greeks.vega * qty,
        rho: acc.rho + sign * greeks.rho * qty,
      };
    },
    { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 },
  );
}

export function findBreakevens(curve: PnLPoint[]): number[] {
  const breakevens: number[] = [];

  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1];
    const curr = curve[i];
    if ((prev.pnl <= 0 && curr.pnl >= 0) || (prev.pnl >= 0 && curr.pnl <= 0)) {
      const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
      const price = prev.stockPrice + ratio * (curr.stockPrice - prev.stockPrice);
      breakevens.push(Number(price.toFixed(2)));
    }
  }

  return breakevens;
}

export function findMaxProfitLoss(curve: PnLPoint[]): {
  maxProfit: number | 'unlimited';
  maxLoss: number | 'unlimited';
} {
  let maxProfit = curve[0].pnl;
  let maxLoss = curve[0].pnl;
  let profitPlateau = true;
  let lossPlateau = true;

  for (const point of curve) {
    if (point.pnl > maxProfit) {
      maxProfit = point.pnl;
      profitPlateau = false;
    }
    if (point.pnl < maxLoss) {
      maxLoss = point.pnl;
      lossPlateau = false;
    }
  }

  const last = curve[curve.length - 1];
  const first = curve[0];
  const profitTrending =
    Math.abs(last.pnl - curve[curve.length - 2].pnl) > 1 ||
    Math.abs(first.pnl - curve[1].pnl) > 1;
  const lossTrending = profitTrending;

  return {
    maxProfit: profitPlateau && profitTrending && maxProfit > 0 ? 'unlimited' : maxProfit,
    maxLoss: lossPlateau && lossTrending && maxLoss < 0 ? 'unlimited' : maxLoss,
  };
}

export function legGreeks(
  leg: OptionLeg,
  stockPrice: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent: number,
): Greeks {
  return calculateGreeks(
    leg.type,
    stockPrice,
    leg.strike,
    dte,
    ivPercent,
    riskFreeRatePercent,
    dividendYieldPercent,
  );
}
