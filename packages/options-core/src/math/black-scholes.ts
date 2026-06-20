import type { Greeks, OptionType } from '../types.js';
import { calculateD1D2, normalCdf, normalPdf, yearsFromDte } from './normal.js';

function validateInputs(
  stockPrice: number,
  strike: number,
  dte: number,
  iv: number,
  riskFreeRate: number,
): void {
  if (stockPrice <= 0) throw new Error('Stock price must be positive');
  if (strike <= 0) throw new Error('Strike must be positive');
  if (dte < 0) throw new Error('DTE cannot be negative');
  if (iv <= 0) throw new Error('IV must be positive');
  if (riskFreeRate < 0) throw new Error('Risk-free rate cannot be negative');
}

export function blackScholesCall(
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): number {
  validateInputs(stockPrice, strike, dte, ivPercent, riskFreeRatePercent);
  const timeYears = yearsFromDte(dte);
  const iv = ivPercent / 100;
  const rate = riskFreeRatePercent / 100;
  const div = dividendYieldPercent / 100;

  if (timeYears <= 0) return Math.max(0, stockPrice - strike);

  const { d1, d2 } = calculateD1D2(stockPrice, strike, timeYears, rate, iv, div);
  const discountFactor = Math.exp(-rate * timeYears);
  const dividendFactor = Math.exp(-div * timeYears);

  return Math.max(
    0,
    stockPrice * dividendFactor * normalCdf(d1) - strike * discountFactor * normalCdf(d2),
  );
}

export function blackScholesPut(
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): number {
  validateInputs(stockPrice, strike, dte, ivPercent, riskFreeRatePercent);
  const timeYears = yearsFromDte(dte);
  const iv = ivPercent / 100;
  const rate = riskFreeRatePercent / 100;
  const div = dividendYieldPercent / 100;

  if (timeYears <= 0) return Math.max(0, strike - stockPrice);
  if (stockPrice <= 0.01) return strike * Math.exp(-rate * timeYears);

  const { d1, d2 } = calculateD1D2(stockPrice, strike, timeYears, rate, iv, div);
  const discountFactor = Math.exp(-rate * timeYears);
  const dividendFactor = Math.exp(-div * timeYears);

  return Math.max(
    0,
    strike * discountFactor * normalCdf(-d2) - stockPrice * dividendFactor * normalCdf(-d1),
  );
}

export function optionPrice(
  type: OptionType,
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): number {
  return type === 'call'
    ? blackScholesCall(stockPrice, strike, dte, ivPercent, riskFreeRatePercent, dividendYieldPercent)
    : blackScholesPut(stockPrice, strike, dte, ivPercent, riskFreeRatePercent, dividendYieldPercent);
}

export function calculateGreeks(
  type: OptionType,
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): Greeks {
  const timeYears = yearsFromDte(dte);
  const iv = ivPercent / 100;
  const rate = riskFreeRatePercent / 100;
  const div = dividendYieldPercent / 100;

  if (timeYears <= 0 || iv <= 0) {
    const intrinsic = type === 'call' ? Math.max(0, stockPrice - strike) : Math.max(0, strike - stockPrice);
    const delta =
      type === 'call'
        ? stockPrice > strike
          ? 1
          : stockPrice < strike
            ? 0
            : 0.5
        : stockPrice < strike
          ? -1
          : stockPrice > strike
            ? 0
            : -0.5;
    return { delta, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const { d1, d2 } = calculateD1D2(stockPrice, strike, timeYears, rate, iv, div);
  const sqrtT = Math.sqrt(timeYears);
  const pdfD1 = normalPdf(d1);
  const discountFactor = Math.exp(-rate * timeYears);
  const dividendFactor = Math.exp(-div * timeYears);

  const gamma = (dividendFactor * pdfD1) / (stockPrice * iv * sqrtT);
  const vega = (stockPrice * dividendFactor * pdfD1 * sqrtT) / 100;

  if (type === 'call') {
    const delta = dividendFactor * normalCdf(d1);
    const theta =
      (-(stockPrice * dividendFactor * pdfD1 * iv) / (2 * sqrtT) -
        rate * strike * discountFactor * normalCdf(d2) +
        div * stockPrice * dividendFactor * normalCdf(d1)) /
      365;
    const rho = (strike * timeYears * discountFactor * normalCdf(d2)) / 100;
    return { delta, gamma, theta, vega, rho };
  }

  const delta = -dividendFactor * normalCdf(-d1);
  const theta =
    (-(stockPrice * dividendFactor * pdfD1 * iv) / (2 * sqrtT) +
      rate * strike * discountFactor * normalCdf(-d2) -
      div * stockPrice * dividendFactor * normalCdf(-d1)) /
    365;
  const rho = (-strike * timeYears * discountFactor * normalCdf(-d2)) / 100;
  return { delta, gamma, theta, vega, rho };
}

export function intrinsicValue(type: OptionType, stockPrice: number, strike: number): number {
  return type === 'call' ? Math.max(0, stockPrice - strike) : Math.max(0, strike - stockPrice);
}

export function pnlAtExpiration(
  type: OptionType,
  side: 'long' | 'short',
  stockPrice: number,
  strike: number,
  premium: number,
  quantity = 1,
  contractMultiplier = 100,
): number {
  const intrinsic = intrinsicValue(type, stockPrice, strike);
  const legPnl = side === 'long' ? intrinsic - premium : premium - intrinsic;
  return legPnl * quantity * contractMultiplier;
}
