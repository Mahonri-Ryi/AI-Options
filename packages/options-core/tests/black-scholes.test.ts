import { describe, expect, it } from 'vitest';
import {
  blackScholesCall,
  blackScholesPut,
  calculateGreeks,
  intrinsicValue,
  optionPrice,
  pnlAtExpiration,
} from '../src/math/black-scholes.js';
import { BS_REFERENCE, expectCloseTo, GREEK_TOLERANCE, STANDARD_INPUTS } from './helpers.js';

describe('Black-Scholes pricing', () => {
  it('matches regression reference values for ATM 30-day options', () => {
    const { stockPrice, dte, iv, riskFreeRate, dividendYield } = STANDARD_INPUTS;
    expectCloseTo(
      blackScholesCall(stockPrice, stockPrice, dte, iv, riskFreeRate, dividendYield),
      BS_REFERENCE.atmCall30d,
    );
    expectCloseTo(
      blackScholesPut(stockPrice, stockPrice, dte, iv, riskFreeRate, dividendYield),
      BS_REFERENCE.atmPut30d,
    );
  });

  it('matches regression reference for longer-dated OTM call', () => {
    expectCloseTo(blackScholesCall(42, 40, 183, 20, 1, 0), BS_REFERENCE.hullCall183d);
  });

  it('satisfies put-call parity: C - P = S - K·e^(-rT)', () => {
    const cases = [
      { s: 100, k: 100, dte: 30, iv: 25, r: 5, q: 0 },
      { s: 150, k: 140, dte: 45, iv: 30, r: 4.5, q: 0 },
      { s: 80, k: 85, dte: 60, iv: 35, r: 3, q: 0 },
      { s: 200, k: 210, dte: 90, iv: 22, r: 5, q: 1.5 },
    ];

    for (const { s, k, dte, iv, r, q } of cases) {
      const call = blackScholesCall(s, k, dte, iv, r, q);
      const put = blackScholesPut(s, k, dte, iv, r, q);
      const t = dte / 365;
      const parity = s * Math.exp(-(q / 100) * t) - k * Math.exp(-(r / 100) * t);
      expectCloseTo(call - put, parity, 0.01);
    }
  });

  it('returns intrinsic value at expiration', () => {
    expect(blackScholesCall(110, 100, 0, 25, 5, 0)).toBe(10);
    expect(blackScholesCall(90, 100, 0, 25, 5, 0)).toBe(0);
    expect(blackScholesPut(90, 100, 0, 25, 5, 0)).toBe(10);
    expect(blackScholesPut(110, 100, 0, 25, 5, 0)).toBe(0);
    expect(blackScholesPut(100, 100, 0, 25, 5, 0)).toBe(0);
  });

  it('approaches deep ITM call intrinsic for very high stock prices', () => {
    const price = blackScholesCall(500, 100, 30, 25, 5, 0);
    const t = 30 / 365;
    const intrinsic = 500 - 100 * Math.exp(-0.05 * t);
    expectCloseTo(price, intrinsic, 0.5);
  });

  it('approaches near-zero for deep OTM options', () => {
    expect(blackScholesCall(50, 200, 30, 25, 5, 0)).toBeLessThan(0.01);
    expect(blackScholesPut(200, 50, 30, 25, 5, 0)).toBeLessThan(0.01);
  });

  it('prices calls higher than puts for ATM with positive rates', () => {
    const call = blackScholesCall(100, 100, 30, 25, 5, 0);
    const put = blackScholesPut(100, 100, 30, 25, 5, 0);
    expect(call).toBeGreaterThan(put);
  });

  it('delegates optionPrice to correct side', () => {
    expect(optionPrice('call', 100, 100, 30, 25, 5, 0)).toBe(
      blackScholesCall(100, 100, 30, 25, 5, 0),
    );
    expect(optionPrice('put', 100, 100, 30, 25, 5, 0)).toBe(
      blackScholesPut(100, 100, 30, 25, 5, 0),
    );
  });

  it('rejects invalid inputs', () => {
    expect(() => blackScholesCall(-1, 100, 30, 25, 5, 0)).toThrow();
    expect(() => blackScholesCall(100, 0, 30, 25, 5, 0)).toThrow();
    expect(() => blackScholesCall(100, 100, -1, 25, 5, 0)).toThrow();
    expect(() => blackScholesCall(100, 100, 30, 0, 5, 0)).toThrow();
    expect(() => blackScholesCall(100, 100, 30, 25, -1, 0)).toThrow();
  });
});

describe('Greeks', () => {
  it('satisfies call delta − put delta ≈ 1 (no dividends)', () => {
    const callGreeks = calculateGreeks('call', 100, 100, 30, 25, 5, 0);
    const putGreeks = calculateGreeks('put', 100, 100, 30, 25, 5, 0);
    expectCloseTo(callGreeks.delta - putGreeks.delta, 1, GREEK_TOLERANCE);
  });

  it('has matching gamma and vega for call/put pair', () => {
    const callGreeks = calculateGreeks('call', 100, 105, 45, 30, 4.5, 0);
    const putGreeks = calculateGreeks('put', 100, 105, 45, 30, 4.5, 0);
    expectCloseTo(callGreeks.gamma, putGreeks.gamma, 0.001);
    expectCloseTo(callGreeks.vega, putGreeks.vega, 0.01);
  });

  it('has positive gamma and vega for long options', () => {
    const greeks = calculateGreeks('call', 100, 100, 30, 25, 5, 0);
    expect(greeks.gamma).toBeGreaterThan(0);
    expect(greeks.vega).toBeGreaterThan(0);
  });

  it('has negative theta for long ATM call', () => {
    const greeks = calculateGreeks('call', 100, 100, 30, 25, 5, 0);
    expect(greeks.theta).toBeLessThan(0);
  });

  it('has call delta between 0 and 1 for standard inputs', () => {
    const greeks = calculateGreeks('call', 100, 100, 30, 25, 5, 0);
    expect(greeks.delta).toBeGreaterThan(0.4);
    expect(greeks.delta).toBeLessThan(0.7);
  });

  it('has put delta between -1 and 0 for standard inputs', () => {
    const greeks = calculateGreeks('put', 100, 100, 30, 25, 5, 0);
    expect(greeks.delta).toBeGreaterThan(-0.6);
    expect(greeks.delta).toBeLessThan(-0.3);
  });
});

describe('P/L at expiration', () => {
  it('computes long call P/L correctly', () => {
    expect(pnlAtExpiration('call', 'long', 120, 100, 3, 1)).toBe(1700);
    expect(pnlAtExpiration('call', 'long', 100, 100, 3, 1)).toBe(-300);
    expect(pnlAtExpiration('call', 'long', 103, 100, 3, 1)).toBe(0);
  });

  it('computes short put P/L correctly', () => {
    expect(pnlAtExpiration('put', 'short', 90, 100, 2, 1)).toBe(-800);
    expect(pnlAtExpiration('put', 'short', 110, 100, 2, 1)).toBe(200);
    expect(pnlAtExpiration('put', 'short', 80, 100, 2.5, 1)).toBe(-1750);
  });

  it('computes intrinsic value for calls and puts', () => {
    expect(intrinsicValue('call', 110, 100)).toBe(10);
    expect(intrinsicValue('put', 90, 100)).toBe(10);
    expect(intrinsicValue('call', 90, 100)).toBe(0);
  });
});
