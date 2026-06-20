import { describe, expect, it } from 'vitest';
import { normalCdf, normalPdf } from '../src/math/normal.js';

describe('Normal distribution helpers', () => {
  it('normalCdf(0) equals 0.5', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 5);
  });

  it('normalCdf is symmetric', () => {
    expect(normalCdf(1.5) + normalCdf(-1.5)).toBeCloseTo(1, 5);
  });

  it('normalPdf peaks at zero', () => {
    expect(normalPdf(0)).toBeGreaterThan(normalPdf(1));
    expect(normalPdf(0)).toBeCloseTo(0.3989422804, 5);
  });
});
