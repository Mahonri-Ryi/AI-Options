import { describe, expect, it } from 'vitest';
import { computeModelerResult } from '../src/modeler/portfolio.js';
import { getIncomeOpportunities } from '../src/premium/income-screener.js';
import { screenIvUniverse } from '../src/premium/iv-screener.js';
import { PREMIUM_FEATURES } from '../src/premium/catalog.js';
import { computeRollAnalyzer } from '../src/premium/roll-analyzer.js';
import {
  createTrialState,
  isPremiumAccess,
  isTrialActive,
  trialDaysRemaining,
} from '../src/premium/trial.js';
import { DEMO_TRADES, summarizeTrades } from '../src/premium/trade-logger.js';

describe('premium trial', () => {
  it('creates a 7-day trial window', () => {
    const now = Date.now();
    const state = createTrialState(now);
    expect(isTrialActive(state, now)).toBe(true);
    expect(isTrialActive(state, now + 8 * 24 * 60 * 60 * 1000)).toBe(false);
    expect(trialDaysRemaining(state, now)).toBe(7);
  });

  it('grants premium access during trial', () => {
    const state = createTrialState();
    expect(isPremiumAccess(state)).toBe(true);
    expect(isPremiumAccess(null)).toBe(false);
  });
});

describe('premium catalog', () => {
  it('lists all premium platform tools', () => {
    expect(PREMIUM_FEATURES).toHaveLength(5);
    expect(PREMIUM_FEATURES.map((f) => f.id)).toEqual([
      'option-modeler',
      'iv-screener',
      'income-analyzer',
      'roll-analyzer',
      'trade-logger',
    ]);
  });
});

describe('option modeler', () => {
  it('builds T+0 and expiration curves for a short put', () => {
    const result = computeModelerResult({
      stockPrice: 100,
      riskFreeRate: 4.5,
      dividendYield: 0,
      stockLegs: [],
      optionLegs: [
        {
          type: 'put',
          side: 'short',
          strike: 95,
          quantity: 1,
          premium: 2.5,
          dte: 30,
          ivPercent: 30,
        },
      ],
    });

    expect(result.curves.length).toBeGreaterThanOrEqual(2);
    expect(result.metrics.breakevens.length).toBeGreaterThan(0);
    expect(result.greeks?.delta).toBeDefined();
  });

  it('includes stock legs in portfolio P/L', () => {
    const result = computeModelerResult({
      stockPrice: 100,
      riskFreeRate: 4.5,
      dividendYield: 0,
      stockLegs: [{ side: 'long', quantity: 1, costBasis: 95 }],
      optionLegs: [],
    });

    const t0 = result.curves[0];
    const midPoint = t0.curve.find((p) => Math.abs(p.stockPrice - 100) < 2);
    expect(midPoint?.pnl).toBeGreaterThan(300);
    expect(midPoint?.pnl).toBeLessThan(600);
  });
});

describe('roll analyzer', () => {
  it('compares before and after roll curves', () => {
    const result = computeRollAnalyzer({
      stockPrice: 100,
      riskFreeRate: 4.5,
      dividendYield: 0,
      before: {
        optionLegs: [
          {
            type: 'put',
            side: 'short',
            strike: 95,
            quantity: 1,
            premium: 2.5,
            dte: 10,
            ivPercent: 30,
          },
        ],
        stockLegs: [],
      },
      after: {
        optionLegs: [
          {
            type: 'put',
            side: 'short',
            strike: 95,
            quantity: 1,
            premium: 1.8,
            dte: 37,
            ivPercent: 30,
          },
        ],
        stockLegs: [],
      },
    });

    expect(result.beforeCurve.length).toBeGreaterThan(10);
    expect(result.afterCurve.length).toBeGreaterThan(10);
    expect(result.netRollCredit).toBeCloseTo(-0.7, 1);
  });
});

describe('iv screener', () => {
  it('filters by IV rank and sorts descending', () => {
    const results = screenIvUniverse({ minIvRank: 70, sortBy: 'ivRank', sortDir: 'desc' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.ivRank >= 70)).toBe(true);
    expect(results[0].ivRank).toBeGreaterThanOrEqual(results[results.length - 1].ivRank);
  });
});

describe('income screener', () => {
  it('returns CSP and CC opportunities with positive yield', () => {
    const results = getIncomeOpportunities({ minYield: 1 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.annualizedYield >= 1)).toBe(true);
    expect(new Set(results.map((r) => r.strategy)).size).toBe(2);
  });
});

describe('trade logger', () => {
  it('summarizes demo trades with realized P/L', () => {
    const summary = summarizeTrades(DEMO_TRADES);
    expect(summary.openCount).toBe(2);
    expect(summary.closedCount).toBe(2);
    expect(summary.realizedPnl).toBeGreaterThan(0);
  });
});
