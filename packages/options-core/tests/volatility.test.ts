import { describe, expect, it } from 'vitest';
import { blackScholesCall, blackScholesPut } from '../src/math/black-scholes.js';
import {
  expectedMove,
  impliedVolatility,
  thetaDecayCurve,
} from '../src/math/volatility.js';
import { expectCloseTo, IV_TOLERANCE } from './helpers.js';

describe('Implied volatility', () => {
  const cases = [
    { type: 'call' as const, s: 100, k: 105, dte: 45, iv: 32, r: 4.5, q: 0 },
    { type: 'put' as const, s: 100, k: 95, dte: 30, iv: 28, r: 5, q: 0 },
    { type: 'call' as const, s: 200, k: 210, dte: 60, iv: 22, r: 3, q: 1 },
    { type: 'put' as const, s: 50, k: 55, dte: 14, iv: 45, r: 5, q: 0 },
  ];

  for (const { type, s, k, dte, iv, r, q } of cases) {
    it(`recovers ${iv}% IV for ${type} (S=${s}, K=${k})`, () => {
      const priceFn = type === 'call' ? blackScholesCall : blackScholesPut;
      const marketPrice = priceFn(s, k, dte, iv, r, q);
      const solved = impliedVolatility(type, marketPrice, s, k, dte, r, q);
      expect(Math.abs(solved - iv)).toBeLessThan(IV_TOLERANCE);
    });
  }

  it('re-prices to original market value after solving IV', () => {
    const type = 'call';
    const s = 100;
    const k = 100;
    const dte = 30;
    const iv = 25;
    const r = 5;
    const marketPrice = blackScholesCall(s, k, dte, iv, r, 0);
    const solvedIv = impliedVolatility(type, marketPrice, s, k, dte, r, 0);
    const repriced = blackScholesCall(s, k, dte, solvedIv, r, 0);
    expectCloseTo(repriced, marketPrice, 0.001);
  });

  it('rejects invalid inputs', () => {
    expect(() => impliedVolatility('call', 0, 100, 100, 30, 5, 0)).toThrow();
    expect(() => impliedVolatility('call', 2.5, 100, 100, 0, 5, 0)).toThrow();
  });
});

describe('Expected move', () => {
  it('computes symmetric bounds around stock price', () => {
    const move = expectedMove(200, 30, 30);
    expectCloseTo(move.up - 200, 200 - move.down, 0.01);
  });

  it('matches formula: move = S × IV × √(DTE/365)', () => {
    const s = 100;
    const iv = 30;
    const dte = 45;
    const move = expectedMove(s, iv, dte);
    const expectedDollars = s * (iv / 100) * Math.sqrt(dte / 365);
    expectCloseTo(move.moveDollars, expectedDollars, 0.01);
    expectCloseTo(move.up, s + expectedDollars, 0.01);
    expectCloseTo(move.down, s - expectedDollars, 0.01);
  });

  it('increases with higher IV and longer DTE', () => {
    const base = expectedMove(100, 25, 30);
    const higherIv = expectedMove(100, 40, 30);
    const longerDte = expectedMove(100, 25, 90);
    expect(higherIv.moveDollars).toBeGreaterThan(base.moveDollars);
    expect(longerDte.moveDollars).toBeGreaterThan(base.moveDollars);
  });
});

describe('Theta decay curve', () => {
  it('is monotonically non-increasing for long ATM call (time value decays)', () => {
    const curve = thetaDecayCurve('call', 100, 100, 45, 30, 4.5, 0);
    expect(curve[0].dte).toBe(45);
    expect(curve[curve.length - 1].dte).toBe(0);

    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].price).toBeLessThanOrEqual(curve[i - 1].price + 0.01);
    }
  });

  it('ends at intrinsic value at expiration', () => {
    const curve = thetaDecayCurve('call', 110, 100, 30, 25, 5, 0);
    expectCloseTo(curve[curve.length - 1].price, 10, 0.01);
  });

  it('starts above intrinsic for OTM options', () => {
    const curve = thetaDecayCurve('call', 100, 110, 30, 25, 5, 0);
    expect(curve[0].price).toBeGreaterThan(0);
    expect(curve[curve.length - 1].price).toBe(0);
  });
});
