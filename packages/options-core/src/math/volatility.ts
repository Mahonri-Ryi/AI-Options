import type { OptionType } from '../types.js';
import { blackScholesCall, blackScholesPut } from './black-scholes.js';

const MAX_ITERATIONS = 100;
const TOLERANCE = 1e-6;

export function impliedVolatility(
  type: OptionType,
  marketPrice: number,
  stockPrice: number,
  strike: number,
  dte: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): number {
  if (marketPrice <= 0) throw new Error('Market price must be positive');
  if (dte <= 0) throw new Error('DTE must be positive for IV calculation');

  const priceFn =
    type === 'call' ? blackScholesCall : blackScholesPut;

  let low = 0.01;
  let high = 5;
  let mid = (low + high) / 2;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    mid = (low + high) / 2;
    const ivPercent = mid * 100;
    const theoretical = priceFn(
      stockPrice,
      strike,
      dte,
      ivPercent,
      riskFreeRatePercent,
      dividendYieldPercent,
    );

    if (Math.abs(theoretical - marketPrice) < TOLERANCE) {
      return ivPercent;
    }

    if (theoretical > marketPrice) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return mid * 100;
}

export function expectedMove(
  stockPrice: number,
  ivPercent: number,
  dte: number,
): { up: number; down: number; moveDollars: number; movePercent: number } {
  const timeYears = dte / 365;
  const movePercent = ivPercent * Math.sqrt(timeYears);
  const moveDollars = stockPrice * (movePercent / 100);
  return {
    up: stockPrice + moveDollars,
    down: stockPrice - moveDollars,
    moveDollars,
    movePercent,
  };
}

export function thetaDecayCurve(
  type: OptionType,
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): Array<{ dte: number; price: number }> {
  const points: Array<{ dte: number; price: number }> = [];
  const priceFn = type === 'call' ? blackScholesCall : blackScholesPut;

  for (let day = dte; day >= 0; day--) {
    points.push({
      dte: day,
      price: priceFn(
        stockPrice,
        strike,
        day,
        ivPercent,
        riskFreeRatePercent,
        dividendYieldPercent,
      ),
    });
  }

  return points;
}
