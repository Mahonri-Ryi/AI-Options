import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_CONFIGS,
  computeCalculator,
  getDefaultValues,
  STRATEGIES,
} from '../src/index.js';
import {
  refBullCallSpreadMetrics,
  refExpectedMoveCalc,
  refLongCallMetrics,
} from './reference-simulator.js';
import { BREAKEVEN_TOLERANCE, expectCloseTo, PRICE_TOLERANCE } from './helpers.js';

describe('reference parity — long call defaults', () => {
  it('matches reference premium, breakeven, max loss, and chart range', () => {
    const defaults = getDefaultValues('long-call');
    const result = computeCalculator('long-call', defaults)!;
    const ref = refLongCallMetrics({
      stockPrice: 100,
      strike: 105,
      dte: 30,
      iv: 25,
      riskFreeRate: 5,
      dividendYield: 0,
      quantity: 1,
    });

    expectCloseTo(result.metrics.premium, ref.premium);
    expectCloseTo(result.metrics.maxLoss as number, ref.maxLoss);
    expect(Math.abs(result.metrics.breakevens[0] - ref.breakeven)).toBeLessThan(
      BREAKEVEN_TOLERANCE,
    );
    expect(result.chartRange?.min).toBe(ref.chartRange.min);
    expect(result.chartRange?.max).toBe(ref.chartRange.max);
    expect(result.theoreticalCurve?.length).toBeGreaterThan(0);
    expect(result.theoreticalCurve?.length).toBe(result.curve.length);
    expect(result.chartAxes?.xTicks.length).toBeGreaterThan(2);
    expect(result.chartAxes?.yTicks).toContain(0);
  });
});

describe('reference parity — bull call spread defaults', () => {
  it('matches reference spread metrics and dual curves', () => {
    const defaults = getDefaultValues('bull-call-spread');
    const result = computeCalculator('bull-call-spread', defaults)!;
    const ref = refBullCallSpreadMetrics({
      stockPrice: 100,
      longStrike: 100,
      shortStrike: 110,
      dte: 30,
      iv: 25,
      riskFreeRate: 5,
      dividendYield: 0,
      quantity: 1,
    });

    expectCloseTo(result.metrics.maxProfit as number, ref.maxProfit, 1);
    expectCloseTo(result.metrics.maxLoss as number, ref.maxLoss, 1);
    expect(Math.abs(result.metrics.breakevens[0] - ref.breakeven)).toBeLessThan(
      BREAKEVEN_TOLERANCE,
    );
    expect(result.chartRange?.min).toBeCloseTo(ref.chartRange.min, 0);
    expect(result.chartRange?.max).toBeCloseTo(ref.chartRange.max, 0);
    expect(result.theoreticalCurve?.length).toBe(result.curve.length);
  });
});

describe('reference parity — expected move defaults', () => {
  it('matches reference expected move formula', () => {
    const defaults = getDefaultValues('expected-move');
    const result = computeCalculator('expected-move', defaults)!;
    const ref = refExpectedMoveCalc(100, 30, 30);

    expectCloseTo(result.metrics.maxProfit as number, ref.up, 0.01);
    expectCloseTo(result.metrics.maxLoss as number, ref.down, 0.01);
    expectCloseTo(result.metrics.netPremium, ref.moveDollars, 0.01);
  });
});

describe('reference parity — all strategy calculators', () => {
  const strategyIds = STRATEGIES.map((s) => s.id).filter(
    (id) => !['options-pricing', 'implied-volatility', 'theta-decay', 'expected-move'].includes(id),
  );

  for (const id of strategyIds) {
    it(`${id}: produces dual curves, chart range, and finite metrics`, () => {
      const defaults = getDefaultValues(id);
      const result = computeCalculator(id, defaults);
      expect(result).not.toBeNull();
      expect(result!.curve.length).toBeGreaterThan(10);
      expect(result!.theoreticalCurve?.length).toBe(result!.curve.length);
      expect(result!.chartRange).toBeDefined();
      expect(result!.chartRange!.min).toBeLessThan(result!.chartRange!.max);
      expect(result!.chartAxes).toBeDefined();
      expect(result!.chartAxes!.yDomain[0]).toBeLessThan(0);
      expect(result!.chartAxes!.yDomain[1]).toBeGreaterThan(0);
      expect(Number.isFinite(result!.metrics.premium)).toBe(true);
    });
  }
});

describe('reference parity — pricing calculators', () => {
  it('options pricing returns greeks', () => {
    const result = computeCalculator('options-pricing', getDefaultValues('options-pricing'));
    expect(result?.greeks?.delta).toBeDefined();
  });

  it('implied volatility is positive for defaults', () => {
    const result = computeCalculator('implied-volatility', getDefaultValues('implied-volatility'));
    expect(result!.metrics.premium).toBeGreaterThan(0);
  });

  it('theta decay curve spans DTE range', () => {
    const result = computeCalculator('theta-decay', getDefaultValues('theta-decay'));
    expect(result!.curve.length).toBeGreaterThan(40);
  });
});

describe('reference parity — curve point alignment', () => {
  it('long call curve uses $0.10 steps', () => {
    const result = computeCalculator('long-call', getDefaultValues('long-call'))!;
    const steps = result.curve.slice(1).map((p, i) => p.stockPrice - result.curve[i].stockPrice);
    expect(steps.every((s) => Math.abs(s - 0.1) < 0.001 || Math.abs(s - 1) < 0.001)).toBe(true);
  });
});
