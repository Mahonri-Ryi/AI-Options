# Calculation Testing

The `@ai-options/core` package has **96 automated tests** that verify financial calculation accuracy.

## What's tested

| Suite | Coverage |
|-------|----------|
| `black-scholes.test.ts` | Put-call parity, regression reference values, Greeks relationships, expiration intrinsic value, input validation |
| `volatility.test.ts` | IV round-trip (4 scenarios), expected move formula, theta decay monotonicity |
| `curve.test.ts` | P/L curve building, breakeven interpolation, max profit/loss detection |
| `strategies.test.ts` | All 15 strategy functions with analytical P/L verification, 15 integrity checks |
| `calculator-configs.test.ts` | All 19 calculator configs compute without error, pricing tools validated |
| `normal.test.ts` | Normal distribution CDF/PDF mathematical properties |

## Running tests

```bash
# From repo root
npm test

# Watch mode
npm run test:watch -w @ai-options/core

# With coverage
npm run test:coverage -w @ai-options/core
```

## Accuracy guarantees

1. **Put-call parity** — Verified across multiple strike/IV/rate combinations
2. **IV solver** — Round-trip tests confirm recovered IV re-prices to original market value
3. **Strategy P/L** — Manual expiration math cross-checked via `pnlAtExpiration()`
4. **Spread economics** — Max profit/loss formulas verified for debit and credit spreads
5. **Regression values** — Key Black-Scholes outputs locked to prevent drift

## CI

Tests run automatically on every push via GitHub Actions (`.github/workflows/test.yml`).

A reference check (`npm run check:refs`) fails the build if forbidden external source names appear outside `.cursor/rules/`.
