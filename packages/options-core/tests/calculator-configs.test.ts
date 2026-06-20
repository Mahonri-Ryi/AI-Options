import { describe, expect, it } from 'vitest';
import {
  CALCULATOR_CONFIGS,
  STRATEGIES,
  computeCalculator,
  getDefaultValues,
  optionsPricing,
} from '../src/index.js';

describe('Calculator configs', () => {
  it('defines a calculator for every strategy in the catalog', () => {
    expect(Object.keys(CALCULATOR_CONFIGS).length).toBe(STRATEGIES.length);
    for (const strategy of STRATEGIES) {
      expect(CALCULATOR_CONFIGS[strategy.id]).toBeDefined();
      expect(CALCULATOR_CONFIGS[strategy.id].title).toBe(strategy.name);
    }
  });

  for (const id of Object.keys(CALCULATOR_CONFIGS)) {
    it(`${id}: computes without error using defaults`, () => {
      const defaults = getDefaultValues(id);
      const config = CALCULATOR_CONFIGS[id];

      expect(config.fields.length).toBeGreaterThan(0);
      for (const field of config.fields) {
        expect(defaults[field.key]).toBeDefined();
      }

      const result = computeCalculator(id, defaults);
      expect(result).not.toBeNull();
      expect(result!.metrics).toBeDefined();
      expect(Number.isFinite(result!.metrics.premium)).toBe(true);
    });
  }

  it('options-pricing returns greeks with valid delta range', () => {
    const id = 'options-pricing';
    const defaults = getDefaultValues(id);
    const result = computeCalculator(id, defaults);
    expect(result!.greeks).toBeDefined();
    expect(result!.greeks!.delta).toBeGreaterThan(0);
    expect(result!.greeks!.delta).toBeLessThan(1);
  });

  it('implied-volatility returns positive IV', () => {
    const result = computeCalculator('implied-volatility', getDefaultValues('implied-volatility'));
    expect(result!.metrics.premium).toBeGreaterThan(0);
  });

  it('theta-decay produces descending price curve', () => {
    const result = computeCalculator('theta-decay', getDefaultValues('theta-decay'));
    expect(result!.curve.length).toBeGreaterThan(1);
    const first = result!.curve[0].pnl;
    const last = result!.curve[result!.curve.length - 1].pnl;
    expect(first).toBeGreaterThanOrEqual(last);
  });

  it('expected-move returns symmetric bounds', () => {
    const defaults = getDefaultValues('expected-move');
    const result = computeCalculator('expected-move', defaults);
    const stock = Number(defaults.stockPrice);
    const upDist = (result!.metrics.maxProfit as number) - stock;
    const downDist = stock - (result!.metrics.maxLoss as number);
    expect(Math.abs(upDist - downDist)).toBeLessThan(0.01);
  });
});

describe('optionsPricing standalone', () => {
  it('returns consistent price and greeks', () => {
    const { price, greeks } = optionsPricing({
      stockPrice: 100,
      strike: 100,
      dte: 30,
      iv: 25,
      riskFreeRate: 5,
      dividendYield: 0,
      type: 'call',
    });
    expect(price).toBeGreaterThan(0);
    expect(greeks.delta).toBeGreaterThan(0.4);
    expect(greeks.gamma).toBeGreaterThan(0);
    expect(greeks.theta).toBeLessThan(0);
    expect(greeks.vega).toBeGreaterThan(0);
  });
});
