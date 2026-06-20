/**
 * Ported reference calculator algorithms (from reference site JS bundles).
 * Used only in tests to verify parity — never imported by app code.
 */
import { blackScholesCall, blackScholesPut } from '../src/math/black-scholes.js';
import { DAYS_PER_YEAR_EM } from '../src/math/constants.js';

const SHARES = 100;

export function refExpectedMove(stockPrice: number, dte: number, iv: number): number {
  return stockPrice * (iv / 100) * Math.sqrt(dte / DAYS_PER_YEAR_EM);
}

export function refSingleLegRange(
  stockPrice: number,
  strike: number,
  dte: number,
  iv: number,
): { min: number; max: number } {
  const move = refExpectedMove(stockPrice, dte, iv);
  const padding = Math.max(move * 1.5, stockPrice * 0.1);
  return {
    min: Math.max(0, Math.floor(Math.min(stockPrice, strike) - padding)),
    max: Math.ceil(Math.max(stockPrice, strike) + padding),
  };
}

export function refSpreadRange(
  stockPrice: number,
  longStrike: number,
  shortStrike: number,
  dte: number,
  iv: number,
): { min: number; max: number } {
  const move = refExpectedMove(stockPrice, dte, iv);
  const padding = Math.max(move * 1.5, stockPrice * 0.15);
  return {
    min: Math.max(0.01, Math.min(stockPrice, longStrike) - padding),
    max: Math.max(stockPrice, shortStrike) + padding,
  };
}

export function refStep(rangeWidth: number, spread = false): number {
  if (spread) return rangeWidth > 200 ? 1 : 0.25;
  return rangeWidth >= 1000 ? 1 : 0.1;
}

export function refLongCallMetrics(inputs: {
  stockPrice: number;
  strike: number;
  dte: number;
  iv: number;
  riskFreeRate: number;
  dividendYield: number;
  quantity: number;
}) {
  const premium = Math.round(
    blackScholesCall(
      inputs.stockPrice,
      inputs.strike,
      inputs.dte,
      inputs.iv,
      inputs.riskFreeRate,
      inputs.dividendYield,
    ) * 100,
  ) / 100;

  return {
    premium,
    maxLoss: premium * SHARES * inputs.quantity,
    breakeven: inputs.strike + premium,
    chartRange: refSingleLegRange(inputs.stockPrice, inputs.strike, inputs.dte, inputs.iv),
    step: refStep(
      refSingleLegRange(inputs.stockPrice, inputs.strike, inputs.dte, inputs.iv).max -
        refSingleLegRange(inputs.stockPrice, inputs.strike, inputs.dte, inputs.iv).min,
    ),
  };
}

export function refBullCallSpreadMetrics(inputs: {
  stockPrice: number;
  longStrike: number;
  shortStrike: number;
  dte: number;
  iv: number;
  riskFreeRate: number;
  dividendYield: number;
  quantity: number;
}) {
  const longPremium = blackScholesCall(
    inputs.stockPrice,
    inputs.longStrike,
    inputs.dte,
    inputs.iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const shortPremium = blackScholesCall(
    inputs.stockPrice,
    inputs.shortStrike,
    inputs.dte,
    inputs.iv,
    inputs.riskFreeRate,
    inputs.dividendYield,
  );
  const netDebit = longPremium - shortPremium;
  const width = inputs.shortStrike - inputs.longStrike;
  return {
    netDebit,
    maxProfit: (width - netDebit) * SHARES * inputs.quantity,
    maxLoss: netDebit * SHARES * inputs.quantity,
    breakeven: inputs.longStrike + netDebit,
    chartRange: refSpreadRange(
      inputs.stockPrice,
      inputs.longStrike,
      inputs.shortStrike,
      inputs.dte,
      inputs.iv,
    ),
  };
}

export function refExpectedMoveCalc(stockPrice: number, iv: number, dte: number) {
  const move = refExpectedMove(stockPrice, dte, iv);
  return {
    up: stockPrice + move,
    down: stockPrice - move,
    moveDollars: move,
    movePercent: (move / stockPrice) * 100,
  };
}

export function refExpirationPnl(
  stockPrice: number,
  strike: number,
  premium: number,
  type: 'call' | 'put',
  side: 'long' | 'short',
  quantity: number,
): number {
  const intrinsic =
    type === 'call' ? Math.max(0, stockPrice - strike) : Math.max(0, strike - stockPrice);
  const value = side === 'long' ? intrinsic - premium : premium - intrinsic;
  return value * SHARES * quantity;
}

export function refTheoreticalPnl(
  stockPrice: number,
  strike: number,
  premium: number,
  type: 'call' | 'put',
  side: 'long' | 'short',
  quantity: number,
  dte: number,
  iv: number,
  riskFreeRate: number,
  dividendYield: number,
): number {
  const theoretical =
    type === 'call'
      ? blackScholesCall(stockPrice, strike, dte, iv, riskFreeRate, dividendYield)
      : blackScholesPut(stockPrice, strike, dte, iv, riskFreeRate, dividendYield);
  const value = side === 'long' ? theoretical - premium : premium - theoretical;
  return value * SHARES * quantity;
}
