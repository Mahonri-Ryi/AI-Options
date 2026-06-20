/** Standard normal cumulative distribution function */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/** Standard normal probability density function */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function yearsFromDte(dte: number): number {
  return Math.max(dte, 0) / 365;
}

export interface D1D2 {
  d1: number;
  d2: number;
}

export function calculateD1D2(
  stockPrice: number,
  strike: number,
  timeYears: number,
  riskFreeRate: number,
  volatility: number,
  dividendYield = 0,
): D1D2 {
  const sqrtT = Math.sqrt(timeYears);
  const d1 =
    (Math.log(stockPrice / strike) +
      (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeYears) /
    (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  return { d1, d2 };
}
