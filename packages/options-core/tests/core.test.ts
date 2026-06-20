import { describe, expect, it } from 'vitest';
import {
  blackScholesCall,
  blackScholesPut,
  calculateGreeks,
  expectedMove,
  impliedVolatility,
  longCall,
  bullCallSpread,
  ironCondor,
  optionsPricing,
} from '../src/index.js';

describe('black-scholes', () => {
  it('prices an ATM call with positive value', () => {
    const price = blackScholesCall(100, 100, 30, 25, 5, 0);
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(10);
  });

  it('returns intrinsic value at expiration', () => {
    expect(blackScholesCall(110, 100, 0, 25, 5, 0)).toBe(10);
    expect(blackScholesPut(90, 100, 0, 25, 5, 0)).toBe(10);
  });

  it('calculates greeks for a call', () => {
    const greeks = calculateGreeks('call', 100, 100, 30, 25, 5, 0);
    expect(greeks.delta).toBeGreaterThan(0);
    expect(greeks.delta).toBeLessThan(1);
    expect(greeks.gamma).toBeGreaterThan(0);
    expect(greeks.theta).toBeLessThan(0);
    expect(greeks.vega).toBeGreaterThan(0);
  });
});

describe('implied volatility', () => {
  it('recovers input volatility from market price', () => {
    const iv = 32;
    const price = blackScholesCall(100, 105, 45, iv, 4.5, 0);
    const solved = impliedVolatility('call', price, 100, 105, 45, 4.5, 0);
    expect(solved).toBeCloseTo(iv, 1);
  });
});

describe('expected move', () => {
  it('computes symmetric move bounds', () => {
    const move = expectedMove(200, 30, 30);
    expect(move.up).toBeGreaterThan(200);
    expect(move.down).toBeLessThan(200);
    expect(move.up - 200).toBeCloseTo(200 - move.down, 2);
  });
});

describe('strategies', () => {
  it('calculates long call metrics', () => {
    const result = longCall({
      stockPrice: 100,
      strike: 105,
      dte: 30,
      iv: 25,
      riskFreeRate: 5,
      dividendYield: 0,
      quantity: 1,
      calculationMode: 'iv',
      type: 'call',
      side: 'long',
    });

    expect(result.curve.length).toBeGreaterThan(50);
    expect(result.metrics.premium).toBeGreaterThan(0);
    expect(result.metrics.breakevens.length).toBeGreaterThan(0);
  });

  it('calculates bull call spread with capped risk', () => {
    const result = bullCallSpread({
      stockPrice: 100,
      longStrike: 100,
      shortStrike: 110,
      dte: 30,
      iv: 25,
      riskFreeRate: 5,
      dividendYield: 0,
      quantity: 1,
      calculationMode: 'iv',
      longType: 'call',
    });

    expect(result.metrics.maxProfit).toBeGreaterThan(0);
    expect(result.metrics.maxLoss).toBeGreaterThan(0);
  });

  it('calculates iron condor credit', () => {
    const result = ironCondor({
      stockPrice: 200,
      longPutStrike: 170,
      shortPutStrike: 180,
      shortCallStrike: 220,
      longCallStrike: 230,
      dte: 60,
      iv: 30,
      riskFreeRate: 5,
      dividendYield: 0,
      quantity: 1,
      calculationMode: 'iv',
      positionType: 'short',
    });

    expect(result.metrics.netPremium).toBeGreaterThan(0);
    expect(result.metrics.maxProfit).toBeGreaterThan(0);
  });

  it('exposes standalone pricing calculator', () => {
    const result = optionsPricing({
      stockPrice: 100,
      strike: 100,
      dte: 30,
      iv: 25,
      riskFreeRate: 5,
      dividendYield: 0,
      type: 'call',
    });

    expect(result.price).toBeGreaterThan(0);
    expect(result.greeks.delta).toBeCloseTo(0.55, 1);
  });
});
