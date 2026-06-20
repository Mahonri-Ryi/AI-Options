import { describe, expect, it } from 'vitest';
import {
  bearCallSpread,
  bearPutSpread,
  bullCallSpread,
  bullPutSpread,
  cashSecuredPut,
  coveredCall,
  ironButterfly,
  ironCondor,
  longCall,
  longPut,
  pnlAtExpiration,
  poorMansCoveredCall,
  shortCall,
  shortPut,
  straddle,
  strangle,
} from '../src/index.js';
import {
  BREAKEVEN_TOLERANCE,
  expectCloseTo,
  expectCurveContainsPnL,
  FIXED_PREMIUM_INPUTS,
  STANDARD_INPUTS,
} from './helpers.js';

const price = { ...FIXED_PREMIUM_INPUTS };

describe('Single-leg strategies', () => {
  it('long call: max loss equals premium paid', () => {
    const result = longCall({
      ...price,
      strike: 100,
      type: 'call',
      side: 'long',
      optionPrice: 3,
    });
    expectCloseTo(result.metrics.premium, 3);
    expectCloseTo(result.metrics.maxLoss as number, 300);
    expectCurveContainsPnL(result.curve, 90, -300);
    expectCurveContainsPnL(result.curve, 110, 700);
    expect(Math.abs(result.metrics.breakevens[0] - 103)).toBeLessThan(BREAKEVEN_TOLERANCE);
  });

  it('long put: profits when stock falls below strike', () => {
    const result = longPut({
      ...price,
      strike: 100,
      type: 'put',
      side: 'long',
      optionPrice: 3,
    });
    expectCurveContainsPnL(result.curve, 90, 700);
    expectCurveContainsPnL(result.curve, 110, -300);
    expect(Math.abs(result.metrics.breakevens[0] - 97)).toBeLessThan(BREAKEVEN_TOLERANCE);
  });

  it('short call: max gain equals premium collected', () => {
    const result = shortCall({
      ...price,
      strike: 100,
      type: 'call',
      side: 'short',
      optionPrice: 4,
    });
    expectCurveContainsPnL(result.curve, 95, 400);
    expectCurveContainsPnL(result.curve, 110, -600);
  });

  it('short put: profits when stock stays above strike', () => {
    const result = shortPut({
      ...price,
      strike: 100,
      type: 'put',
      side: 'short',
      optionPrice: 2.5,
    });
    expectCurveContainsPnL(result.curve, 105, 250);
    expectCurveContainsPnL(result.curve, 95, -250);
  });

  it('single-leg P/L matches manual expiration math', () => {
    expect(pnlAtExpiration('call', 'long', 120, 100, 3, 1)).toBe(1700);
    expect(pnlAtExpiration('put', 'long', 80, 100, 3, 1)).toBe(1700);
    expect(pnlAtExpiration('call', 'short', 90, 100, 4, 1)).toBe(400);
    expect(pnlAtExpiration('put', 'short', 80, 100, 2.5, 1)).toBe(-1750);
  });
});

describe('Vertical spreads', () => {
  it('bull call spread: max profit = (width - debit) × 100', () => {
    const result = bullCallSpread({
      ...price,
      longStrike: 100,
      shortStrike: 110,
      longType: 'call',
      longOptionPrice: 5,
      shortOptionPrice: 2,
    });
    expectCloseTo(result.metrics.maxProfit as number, 700);
    expectCloseTo(result.metrics.maxLoss as number, 300);
    expect(Math.abs(result.metrics.breakevens[0] - 103)).toBeLessThan(BREAKEVEN_TOLERANCE);
  });

  it('bear put spread: max profit = (width - debit) × 100', () => {
    const result = bearPutSpread({
      ...price,
      longStrike: 100,
      shortStrike: 90,
      longType: 'put',
      longOptionPrice: 5,
      shortOptionPrice: 2,
    });
    expectCloseTo(result.metrics.maxProfit as number, 700);
    expectCloseTo(result.metrics.maxLoss as number, 300);
  });

  it('bull put spread: max profit = credit × 100', () => {
    const result = bullPutSpread({
      ...price,
      longStrike: 90,
      shortStrike: 100,
      longType: 'put',
      longOptionPrice: 1,
      shortOptionPrice: 3,
    });
    expectCloseTo(result.metrics.maxProfit as number, 200);
    expectCloseTo(result.metrics.maxLoss as number, 800);
  });

  it('bear call spread: max profit = credit × 100', () => {
    const result = bearCallSpread({
      ...price,
      longStrike: 110,
      shortStrike: 100,
      longType: 'call',
      longOptionPrice: 1,
      shortOptionPrice: 3,
    });
    expectCloseTo(result.metrics.maxProfit as number, 200);
    expectCloseTo(result.metrics.maxLoss as number, 800);
  });
});

describe('Income strategies', () => {
  it('covered call: max profit at short strike', () => {
    const result = coveredCall({
      ...price,
      strike: 105,
      shareCostBasis: 95,
      callPremium: 2,
    });
    expectCloseTo(result.metrics.maxProfit as number, 1200);
    expect(result.metrics.breakevens.length).toBeGreaterThan(0);
  });

  it('cash-secured put matches short put economics', () => {
    const result = cashSecuredPut({
      ...price,
      strike: 100,
      type: 'put',
      side: 'short',
      optionPrice: 2.5,
    });
    expectCurveContainsPnL(result.curve, 105, 250);
    expectCurveContainsPnL(result.curve, 95, -250);
  });

  it('PMCC: long LEAPS + short call reduces cost basis', () => {
    const result = poorMansCoveredCall({
      ...price,
      longStrike: 80,
      shortStrike: 105,
      longDte: 180,
      shortDte: 30,
      longPremium: 25,
      shortPremium: 3,
    });
    expect(result.curve.length).toBeGreaterThan(50);
    expectCloseTo(result.metrics.maxLoss as number, 2500);
  });
});

describe('Volatility strategies', () => {
  it('long straddle: has two breakevens and max loss near ATM', () => {
    const result = straddle({
      ...STANDARD_INPUTS,
      strike: 100,
      positionType: 'long',
    });
    expect(result.metrics.breakevens.length).toBe(2);
    const atmPnl = result.curve.reduce((best, p) =>
      Math.abs(p.stockPrice - 100) < Math.abs(best.stockPrice - 100) ? p : best,
    );
    expect(atmPnl.pnl).toBeLessThan(0);
    const maxPricePoint = result.curve[result.curve.length - 1];
    expect(maxPricePoint.pnl).toBeGreaterThan(atmPnl.pnl);
  });

  it('short straddle: collects net premium as max profit', () => {
    const result = straddle({
      ...STANDARD_INPUTS,
      strike: 100,
      positionType: 'short',
    });
    expect(result.metrics.netPremium).toBeGreaterThan(0);
    expect(result.metrics.maxProfit as number).toBeGreaterThan(0);
  });

  it('long strangle: has wider profit zone than ATM straddle at same IV', () => {
    const straddleResult = straddle({
      ...STANDARD_INPUTS,
      strike: 100,
      positionType: 'long',
    });
    const strangleResult = strangle({
      ...STANDARD_INPUTS,
      putStrike: 95,
      callStrike: 105,
      positionType: 'long',
    });
    expect(strangleResult.metrics.breakevens.length).toBe(2);
    const straddleWidth =
      straddleResult.metrics.breakevens[1] - straddleResult.metrics.breakevens[0];
    const strangleWidth =
      strangleResult.metrics.breakevens[1] - strangleResult.metrics.breakevens[0];
    expect(strangleWidth).toBeGreaterThan(straddleWidth);
  });

  it('short iron condor: max profit equals net credit', () => {
    const result = ironCondor({
      ...STANDARD_INPUTS,
      stockPrice: 200,
      longPutStrike: 170,
      shortPutStrike: 180,
      shortCallStrike: 220,
      longCallStrike: 230,
      positionType: 'short',
      calculationMode: 'iv',
      iv: 30,
    });
    expect(result.metrics.maxProfit as number).toBeCloseTo(
      result.metrics.netPremium * 100,
      0,
    );
  });

  it('iron butterfly: body strikes align at same price', () => {
    const result = ironButterfly({
      ...STANDARD_INPUTS,
      stockPrice: 200,
      longPutStrike: 190,
      shortPutStrike: 200,
      shortCallStrike: 200,
      longCallStrike: 210,
      positionType: 'short',
      calculationMode: 'iv',
      iv: 30,
    });
    expect(result.metrics.netPremium).toBeGreaterThan(0);
    expect(result.curve.length).toBeGreaterThan(50);
  });
});

describe('Strategy curve integrity', () => {
  const strategies = [
    () => longCall({ ...STANDARD_INPUTS, strike: 105, type: 'call', side: 'long' }),
    () => longPut({ ...STANDARD_INPUTS, strike: 95, type: 'put', side: 'long' }),
    () => shortCall({ ...STANDARD_INPUTS, strike: 105, type: 'call', side: 'short' }),
    () => shortPut({ ...STANDARD_INPUTS, strike: 95, type: 'put', side: 'short' }),
    () =>
      bullCallSpread({
        ...STANDARD_INPUTS,
        longStrike: 100,
        shortStrike: 110,
        longType: 'call',
      }),
    () =>
      bullPutSpread({
        ...STANDARD_INPUTS,
        longStrike: 90,
        shortStrike: 100,
        longType: 'put',
      }),
    () =>
      bearPutSpread({
        ...STANDARD_INPUTS,
        longStrike: 100,
        shortStrike: 90,
        longType: 'put',
      }),
    () =>
      bearCallSpread({
        ...STANDARD_INPUTS,
        longStrike: 110,
        shortStrike: 100,
        longType: 'call',
      }),
    () => coveredCall({ ...STANDARD_INPUTS, strike: 105, shareCostBasis: 95 }),
    () =>
      cashSecuredPut({ ...STANDARD_INPUTS, strike: 95, type: 'put', side: 'short' }),
    () =>
      poorMansCoveredCall({
        ...STANDARD_INPUTS,
        longStrike: 80,
        shortStrike: 105,
        longDte: 180,
        shortDte: 30,
      }),
    () => straddle({ ...STANDARD_INPUTS, strike: 100, positionType: 'long' }),
    () =>
      strangle({
        ...STANDARD_INPUTS,
        putStrike: 95,
        callStrike: 105,
        positionType: 'long',
      }),
    () =>
      ironCondor({
        ...STANDARD_INPUTS,
        stockPrice: 200,
        longPutStrike: 170,
        shortPutStrike: 180,
        shortCallStrike: 220,
        longCallStrike: 230,
        positionType: 'short',
      }),
    () =>
      ironButterfly({
        ...STANDARD_INPUTS,
        stockPrice: 200,
        longPutStrike: 190,
        shortPutStrike: 200,
        shortCallStrike: 200,
        longCallStrike: 210,
        positionType: 'short',
      }),
  ];

  for (let i = 0; i < strategies.length; i++) {
    it(`strategy ${i + 1} produces a valid P/L curve spanning stock price`, () => {
      const result = strategies[i]();
      expect(result.curve.length).toBeGreaterThan(10);
      expect(result.chartRange).toBeDefined();
      const range = result.chartRange!.max - result.chartRange!.min;
      expect(range).toBeGreaterThan(5);
    });
  }
});
