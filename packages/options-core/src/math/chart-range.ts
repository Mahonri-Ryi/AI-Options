import { DAYS_PER_YEAR_EM } from './constants.js';

export interface PriceRange {
  min: number;
  max: number;
}

export function expectedMoveDollars(
  stockPrice: number,
  dte: number,
  ivPercent: number,
): number {
  return stockPrice * (ivPercent / 100) * Math.sqrt(dte / DAYS_PER_YEAR_EM);
}

/** Single-leg chart range (10% stock floor on padding) */
export function singleLegChartRange(
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
): PriceRange {
  const move = expectedMoveDollars(stockPrice, dte, ivPercent);
  const padding = Math.max(move * 1.5, stockPrice * 0.1);
  const minStrike = Math.min(stockPrice, strike);
  const maxStrike = Math.max(stockPrice, strike);
  return {
    min: Math.max(0, Math.floor(minStrike - padding)),
    max: Math.ceil(maxStrike + padding),
  };
}

/** Multi-strike / spread chart range (15% stock floor on padding) */
export function spreadChartRange(
  stockPrice: number,
  longStrike: number,
  shortStrike: number,
  dte: number,
  ivPercent: number,
): PriceRange {
  const move = expectedMoveDollars(stockPrice, dte, ivPercent);
  const padding = Math.max(move * 1.5, stockPrice * 0.15);
  return {
    min: Math.max(0.01, Math.min(stockPrice, longStrike) - padding),
    max: Math.max(stockPrice, shortStrike) + padding,
  };
}

/** PMCC chart range (20% stock floor on padding, uses long DTE) */
export function pmccChartRange(
  stockPrice: number,
  longStrike: number,
  shortStrike: number,
  longDte: number,
  ivPercent: number,
): PriceRange {
  const move = expectedMoveDollars(stockPrice, longDte, ivPercent);
  const padding = Math.max(move * 1.5, stockPrice * 0.2);
  return {
    min: Math.max(0.01, Math.min(stockPrice, longStrike) - padding),
    max: Math.max(stockPrice, shortStrike) + padding,
  };
}

/** Covered call chart range (20% expected move multiplier) */
export function coveredCallChartRange(
  stockPrice: number,
  strike: number,
  dte: number,
  ivPercent: number,
): PriceRange {
  const move = expectedMoveDollars(stockPrice, dte, ivPercent);
  const padding = Math.max(move * 1.2, stockPrice * 0.1);
  const minStrike = Math.min(stockPrice, strike);
  const maxStrike = Math.max(stockPrice, strike);
  return {
    min: Math.max(0, Math.floor(minStrike - padding)),
    max: Math.ceil(maxStrike + padding),
  };
}

/** Iron condor / multi-wing range using all strikes */
export function multiStrikeChartRange(
  stockPrice: number,
  strikes: number[],
  dte: number,
  ivPercent: number,
): PriceRange {
  const move = expectedMoveDollars(stockPrice, dte, ivPercent);
  const padding = Math.max(move * 1.5, stockPrice * 0.15);
  const all = [stockPrice, ...strikes];
  return {
    min: Math.max(0.01, Math.min(...all) - padding),
    max: Math.max(...all) + padding,
  };
}

export function singleLegStepSize(rangeWidth: number): number {
  return rangeWidth >= 1000 ? 1 : 0.1;
}

export function spreadStepSize(rangeWidth: number): number {
  return rangeWidth > 200 ? 1 : 0.25;
}

export function buildStockPricePoints(
  range: PriceRange,
  step: number,
): number[] {
  let start = Math.floor(range.min / step) * step;
  if (start <= 0) start = step;
  const points: number[] = [];
  for (let price = start; price <= range.max; price += step) {
    points.push(Math.round(price * 100) / 100);
  }
  return points;
}

/** Y-axis domain with 15% padding, always showing zero */
export function chartYDomain(curves: Array<Array<{ pnl: number }>>): [number, number] {
  const pnls = curves.flatMap((curve) => curve.map((point) => point.pnl));
  if (pnls.length === 0) return [-100, 100];

  const minPnl = Math.min(...pnls);
  const maxPnl = Math.max(...pnls);
  const pad = (maxPnl - minPnl) * 0.15 || 100;
  const yMin = Math.min(minPnl - pad, -pad * 0.5);
  const yMax = Math.max(maxPnl + pad, pad * 0.5);
  return [yMin, yMax];
}

/** Nice X-axis ticks (reference chart-axis algorithm) */
export function nicePriceTicks(min: number, max: number, targetCount = 10): number[] {
  const span = max - min;
  if (span <= 0 || !Number.isFinite(span)) return [Math.round(min)];

  const roughStep = span / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let niceNormalized: number;
  if (normalized <= 1.5) niceNormalized = 1;
  else if (normalized <= 3) niceNormalized = 2;
  else if (normalized <= 7) niceNormalized = 5;
  else niceNormalized = 10;

  const step = Math.max(1, Math.round(niceNormalized * magnitude));
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick <= max; tick += step) {
    ticks.push(tick);
  }
  return ticks;
}

/** Nice Y-axis ticks including zero */
export function nicePnlTicks(min: number, max: number, targetCount = 8): number[] {
  const span = max - min;
  if (span <= 0 || !Number.isFinite(span)) return [0];

  const roughStep = span / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let niceNormalized: number;
  if (normalized <= 1.5) niceNormalized = 1;
  else if (normalized <= 3) niceNormalized = 2;
  else if (normalized <= 7) niceNormalized = 5;
  else niceNormalized = 10;

  const step = niceNormalized * magnitude;
  const ticks = new Set<number>([0]);
  let tick = step;
  while (tick <= max + step * 0.1) {
    ticks.add(tick);
    tick += step;
  }
  tick = -step;
  while (tick >= min - step * 0.1) {
    ticks.add(tick);
    tick -= step;
  }
  return Array.from(ticks).sort((a, b) => a - b);
}
