import { DAYS_PER_YEAR_EM } from './constants.js';
import { expectedMoveDollars } from './chart-range.js';
import type { OptionType, ThetaDecayChartData, ThetaDecayDetail } from '../types.js';
import { blackScholesCall, blackScholesPut, calculateGreeks } from './black-scholes.js';

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

  const priceFn = type === 'call' ? blackScholesCall : blackScholesPut;

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
  const moveDollars = expectedMoveDollars(stockPrice, dte, ivPercent);
  const movePercent = (moveDollars / stockPrice) * 100;
  return {
    up: stockPrice + moveDollars,
    down: stockPrice - moveDollars,
    moveDollars,
    movePercent,
  };
}

export function expectedMoveDetail(stockPrice: number, ivPercent: number, dte: number) {
  const move = expectedMoveDollars(stockPrice, dte, ivPercent);
  return {
    expectedMove: move,
    upperBound: stockPrice + move,
    lowerBound: stockPrice - move,
    dailyMove: expectedMoveDollars(stockPrice, 1, ivPercent),
    weeklyMove: expectedMoveDollars(stockPrice, 7, ivPercent),
    movePercent: (move / stockPrice) * 100,
    probability: 68.2,
  };
}

export function expectedMoveCone(stockPrice: number, ivPercent: number, maxDte: number) {
  const points = [];
  for (let dte = 0; dte <= maxDte; dte++) {
    const em = expectedMoveDollars(stockPrice, dte, ivPercent);
    points.push({
      dte,
      upper: stockPrice + em,
      lower: stockPrice - em,
      expectedMove: em,
    });
  }
  return points;
}

function intrinsicValue(
  stockPrice: number,
  strike: number,
  type: OptionType,
): number {
  return type === 'call'
    ? Math.max(0, stockPrice - strike)
    : Math.max(0, strike - stockPrice);
}

function optionPriceAtDte(
  type: OptionType,
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent: number,
): number {
  if (dte <= 0) return intrinsicValue(stockPrice, strike, type);
  return type === 'call'
    ? blackScholesCall(
        stockPrice,
        strike,
        dte,
        ivPercent,
        riskFreeRatePercent,
        dividendYieldPercent,
      )
    : blackScholesPut(
        stockPrice,
        strike,
        dte,
        ivPercent,
        riskFreeRatePercent,
        dividendYieldPercent,
      );
}

function moneynessLabel(
  stockPrice: number,
  strike: number,
  type: OptionType,
): 'ITM' | 'ATM' | 'OTM' {
  if (Math.abs(stockPrice - strike) / strike < 0.02) return 'ATM';
  if (type === 'call') return stockPrice > strike ? 'ITM' : 'OTM';
  return stockPrice < strike ? 'ITM' : 'OTM';
}

function extrinsicHalfLife(
  decayCurve: Array<{ dte: number; extrinsicValue: number }>,
  initialExtrinsic: number,
): number | null {
  if (initialExtrinsic <= 0) return null;
  for (const point of decayCurve) {
    if ((point.extrinsicValue / initialExtrinsic) * 100 <= 50) {
      return point.dte;
    }
  }
  return null;
}

export function thetaDecayAnalysis(
  type: OptionType,
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): { detail: ThetaDecayDetail; chart: ThetaDecayChartData } {
  const intrinsicAtEntry = intrinsicValue(stockPrice, strike, type);
  const decayCurve = [];
  const intrinsicLine = [];

  for (let day = dte; day >= 0; day--) {
    const optionPrice = optionPriceAtDte(
      type,
      stockPrice,
      strike,
      day,
      ivPercent,
      riskFreeRatePercent,
      dividendYieldPercent,
    );
    const intrinsic = intrinsicValue(stockPrice, strike, type);
    const extrinsic = Math.max(0, optionPrice - intrinsic);
    const theta =
      day > 0
        ? calculateGreeks(
            type,
            stockPrice,
            strike,
            day,
            ivPercent,
            riskFreeRatePercent,
            dividendYieldPercent,
          ).theta
        : 0;

    decayCurve.push({
      dte: day,
      optionPrice,
      intrinsicValue: intrinsic,
      extrinsicValue: extrinsic,
      theta,
    });
    intrinsicLine.push({
      dte: day,
      optionPrice: intrinsic,
      intrinsicValue: intrinsic,
      extrinsicValue: 0,
      theta: 0,
    });
  }

  const entryPrice = decayCurve[0]?.optionPrice ?? 0;
  const expirationValue = intrinsicAtEntry;
  const extrinsicValue = Math.max(0, entryPrice - expirationValue);
  const totalDecay = entryPrice - expirationValue;
  const greeks = calculateGreeks(
    type,
    stockPrice,
    strike,
    dte,
    ivPercent,
    riskFreeRatePercent,
    dividendYieldPercent,
  );

  const detail: ThetaDecayDetail = {
    entryPrice,
    expirationValue,
    totalDecay,
    totalDecayPercent: entryPrice > 0 ? (totalDecay / entryPrice) * 100 : 0,
    currentTheta: greeks.theta,
    intrinsicValue: expirationValue,
    extrinsicValue,
    extrinsicHalfLifeDays: extrinsicHalfLife(decayCurve, extrinsicValue),
    entryDte: dte,
    moneyness: moneynessLabel(stockPrice, strike, type),
  };

  return {
    detail,
    chart: { decayCurve, intrinsicLine },
  };
}

/** @deprecated Use thetaDecayAnalysis */
export function thetaDecayCurve(
  type: OptionType,
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
  riskFreeRatePercent: number,
  dividendYieldPercent = 0,
): Array<{ dte: number; price: number }> {
  const { chart } = thetaDecayAnalysis(
    type,
    stockPrice,
    strike,
    dte,
    ivPercent,
    riskFreeRatePercent,
    dividendYieldPercent,
  );
  return chart.decayCurve.map((point) => ({ dte: point.dte, price: point.optionPrice }));
}
