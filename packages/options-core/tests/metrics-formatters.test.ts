import { describe, expect, it } from 'vitest';
import {
  fmtCompactMoney,
  fmtPercentChange,
  fmtSignedCompactMoney,
  fmtSignedDelta,
  fmtSignedThetaPerDay,
} from '../src/metrics-formatters.js';

describe('metrics formatters', () => {
  it('formats signed compact money like the reference site', () => {
    expect(fmtSignedCompactMoney(2556).text).toBe('+$2,556');
    expect(fmtSignedCompactMoney(-3600).text).toBe('-$3,600');
  });

  it('formats compact money without sign for cost rows', () => {
    expect(fmtCompactMoney(3600)).toBe('$3,600');
  });

  it('formats breakeven percent change with parentheses', () => {
    const pct = fmtPercentChange(183.99, 185);
    expect(pct.text).toMatch(/^\(-\d/);
    expect(pct.variant).toBe('negative');
  });

  it('formats greeks with signs', () => {
    expect(fmtSignedDelta(43.05).text).toBe('+43.05');
    expect(fmtSignedThetaPerDay(4).text).toBe('+$4/day');
  });
});
