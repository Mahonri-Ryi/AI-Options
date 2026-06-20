/** Dollar tolerance for option prices and P/L amounts */
export const PRICE_TOLERANCE = 0.05;

/** Tolerance for IV recovery (percentage points) */
export const IV_TOLERANCE = 0.15;

/** Tolerance for Greeks */
export const GREEK_TOLERANCE = 0.02;

/** Tolerance for breakeven stock prices */
export const BREAKEVEN_TOLERANCE = 0.5;

export function expectCloseTo(
  actual: number,
  expected: number,
  tolerance = PRICE_TOLERANCE,
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

export function expectCurveContainsPnL(
  curve: Array<{ stockPrice: number; pnl: number }>,
  stockPrice: number,
  expectedPnl: number,
  tolerance = 50,
): void {
  const nearest = curve.reduce((best, point) =>
    Math.abs(point.stockPrice - stockPrice) < Math.abs(best.stockPrice - stockPrice)
      ? point
      : best,
  );
  expect(Math.abs(nearest.pnl - expectedPnl)).toBeLessThanOrEqual(tolerance);
}

export const STANDARD_INPUTS = {
  stockPrice: 100,
  dte: 30,
  iv: 25,
  riskFreeRate: 5,
  dividendYield: 0,
  quantity: 1,
  calculationMode: 'iv' as const,
};

export const FIXED_PREMIUM_INPUTS = {
  ...STANDARD_INPUTS,
  calculationMode: 'price' as const,
};

/** Regression reference values — lock in correct implementation */
export const BS_REFERENCE = {
  atmCall30d: 3.0626009751661414,
  atmPut30d: 2.652485351586577,
  hullCall183d: 3.573119311294189,
} as const;
