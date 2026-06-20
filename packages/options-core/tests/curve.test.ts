import { describe, expect, it } from 'vitest';
import {
  buildPnLCurve,
  findBreakevens,
  findMaxProfitLoss,
} from '../src/math/curve.js';
import { pnlAtExpiration } from '../src/math/black-scholes.js';
import { BREAKEVEN_TOLERANCE, expectCloseTo } from './helpers.js';

describe('P/L curve utilities', () => {
  it('builds a curve with the requested number of points', () => {
    const curve = buildPnLCurve((x) => x - 100, 50, 150, 50);
    expect(curve).toHaveLength(50);
    expect(curve[0].stockPrice).toBeCloseTo(50, 0);
    expect(curve[49].stockPrice).toBeCloseTo(150, 0);
  });

  it('finds breakeven via linear interpolation', () => {
    const curve = buildPnLCurve((x) => (x - 105) * 100, 80, 130, 100);
    const breakevens = findBreakevens(curve);
    expect(breakevens.length).toBeGreaterThanOrEqual(1);
    expect(Math.abs(breakevens[0] - 105)).toBeLessThan(BREAKEVEN_TOLERANCE);
  });

  it('finds two breakevens for straddle-like P/L', () => {
    const curve = buildPnLCurve((x) => {
      const move = Math.abs(x - 100);
      return (move - 5) * 100;
    }, 70, 130, 200);
    const breakevens = findBreakevens(curve);
    expect(breakevens.length).toBe(2);
    expect(Math.abs(breakevens[0] - 95)).toBeLessThan(1);
    expect(Math.abs(breakevens[1] - 105)).toBeLessThan(1);
  });

  it('identifies max profit and max loss on bounded curve', () => {
    const curve = buildPnLCurve((x) => {
      if (x < 90) return -500;
      if (x > 110) return -500;
      return 500;
    }, 50, 150, 100);
    const { maxProfit, maxLoss } = findMaxProfitLoss(curve);
    expect(maxProfit).toBe(500);
    expect(maxLoss).toBe(-500);
  });

  it('reports highest P/L at the upper edge of an upward-sloping curve', () => {
    const curve = buildPnLCurve((x) => (x - 100) * 100, 50, 200, 100);
    const { maxProfit } = findMaxProfitLoss(curve);
    expect(maxProfit).toBe(10000);
    expect(curve[curve.length - 1].pnl).toBe(maxProfit);
  });
});

describe('pnlAtExpiration integration', () => {
  it('scales with contract quantity', () => {
    const single = pnlAtExpiration('call', 'long', 120, 100, 3, 1);
    const double = pnlAtExpiration('call', 'long', 120, 100, 3, 2);
    expect(double).toBe(single * 2);
  });
});
