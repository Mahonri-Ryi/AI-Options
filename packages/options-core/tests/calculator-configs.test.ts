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

  it('expected-move returns cone data and symmetric bounds', () => {
    const defaults = getDefaultValues('expected-move');
    const result = computeCalculator('expected-move', defaults);
    const stock = Number(defaults.stockPrice);
    const detail = result!.expectedMoveDetail!;
    const upDist = detail.upperBound - stock;
    const downDist = stock - detail.lowerBound;
    expect(Math.abs(upDist - downDist)).toBeLessThan(0.01);
    expect(result!.expectedMoveCone?.length).toBe(Number(defaults.dte) + 1);
  });

  it('theta-decay produces analysis chart and metrics', () => {
    const result = computeCalculator('theta-decay', getDefaultValues('theta-decay'));
    expect(result!.thetaDecayDetail).toBeDefined();
    expect(result!.thetaDecayChart?.decayCurve.length).toBeGreaterThan(1);
    expect(result!.thetaDecayDetail!.entryPrice).toBeGreaterThanOrEqual(
      result!.thetaDecayDetail!.expirationValue,
    );
  });

  it('long-call price mode uses entered option price as premium', () => {
    const defaults = getDefaultValues('long-call');
    const result = computeCalculator('long-call', {
      ...defaults,
      calculationMode: 'price',
      optionPrice: '3.25',
    });
    expect(result!.metrics.premium).toBeCloseTo(3.25, 2);
  });

  it('pmcc visualization includes short-expiration and T+0 chart series', () => {
    const result = computeCalculator('pmcc', getDefaultValues('pmcc'));
    expect(result!.visualization?.chartSeries.length).toBe(2);
    expect(result!.visualization?.chartSeries[0].label).toBe('Today (T+0)');
    expect(result!.visualization?.chartSeries[1].label).toContain('Short Exp');
    expect(result!.visualization?.metricSections.length).toBeGreaterThan(2);
  });

  it('covered-call visualization includes stock comparison line', () => {
    const result = computeCalculator('covered-call', getDefaultValues('covered-call'));
    expect(result!.stockComparisonCurve?.length).toBeGreaterThan(1);
    expect(result!.visualization?.chartSeries.some((s) => s.style === 'stock')).toBe(true);
    expect(result!.visualization?.metricSections.some((s) => s.title === 'Profit Scenarios')).toBe(
      true,
    );
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
