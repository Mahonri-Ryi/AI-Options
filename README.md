# AI Options

Native iOS/Android options calculator app — a recreation of [projectoption.com](https://projectoption.com/calculators) calculators with a scalable market-data backend.

## What's included

| Package | Purpose |
|---------|---------|
| `packages/options-core` | Shared Black-Scholes math, Greeks, IV solver, and all 20 strategy calculators |
| `apps/mobile` | Expo React Native app (iOS + Android) |
| `apps/api` | Fastify market-data API with Redis caching and rate limiting |

## Calculators (20 total)

Mirrors projectoption.com's free calculator suite:

- **Single-leg:** Long Call, Long Put, Short Call, Short Put
- **Vertical spreads:** Bull Call, Bull Put, Bear Put, Bear Call
- **Income:** Covered Call, Cash-Secured Put, Poor Man's Covered Call
- **Volatility:** Straddle, Strangle, Iron Condor, Iron Butterfly
- **Pricing & Greeks:** Options Pricing, Implied Volatility, Theta Decay, Expected Move

## How projectoption.com gets market data

Based on reverse-engineering their production bundles:

### Free calculators — no live data

The 20 free calculators at [projectoption.com/calculators](https://projectoption.com/calculators) are **fully client-side**. They use Black-Scholes-Merton pricing with manually entered inputs (stock price, strike, DTE, IV or option price). No API calls are made — all math runs in the browser via their `greeks.*` and `implied-volatility.*` Astro JS modules.

### Premium features — backend-proxied live data

Their paid Option Modeler and IV Screener use:

1. **Supabase** — authentication (PKCE flow), user profiles, saved portfolios
2. **`api.projectoption.com`** — backend API that proxies market data (discovered in their `auth.*.js` bundle: `origin.replace("www.", "api.")`)
3. **Commercial options feed** (inferred) — coverage of 4,000+ US equities/ETFs with live chains, quotes, and Greeks strongly suggests **Polygon.io** or an equivalent vendor (Tradier, Market Data API, Intrinio)

They never expose vendor API keys to the client. All live data flows: **Mobile/Browser → their API → market data vendor**.

### Our architecture (designed for 100k+ users)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  iOS / Android  │────▶│   Fastify API    │────▶│  Polygon.io     │
│  (Expo RN app)  │     │  + Redis cache   │     │  (or Tradier)   │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  options-core   │  ← All P/L math runs on-device (zero latency)
│  (TypeScript)   │
└─────────────────┘
```

**Scaling principles:**

| Layer | Strategy |
|-------|----------|
| Calculations | On-device via `options-core` — no server load for free calculators |
| Market data | Redis cache (15s quotes, 60s chains), rate limiting (120 req/min/IP) |
| API | Horizontally scalable Fastify on Cloud Run / ECS / Railway |
| CDN | Cache static responses at edge for symbol search |
| Cost control | One Polygon subscription serves all users via shared cache |

## Quick start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start API (mock data without POLYGON_API_KEY)
npm run api

# Start mobile app
npm run mobile
```

### Environment variables

```bash
# apps/api
POLYGON_API_KEY=your_key_here   # Optional — uses mock data if unset
REDIS_URL=redis://localhost:6379  # Optional — uses in-memory cache if unset
PORT=8001
```

## Mobile development

```bash
cd apps/mobile
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

## API endpoints

| Endpoint | Description | Cache TTL |
|----------|-------------|-----------|
| `GET /health` | Health check | — |
| `GET /api/v1/quote/:symbol` | Stock quote | 15s |
| `GET /api/v1/options/:symbol/chain` | Options chain | 60s |
| `GET /api/v1/search?q=AAP` | Symbol search | 5min |

## Project structure

```
ai-options/
├── packages/options-core/     # Shared math library
│   ├── src/math/              # Black-Scholes, IV, curves
│   └── src/strategies/        # All 20 calculators
├── apps/mobile/               # Expo React Native app
│   ├── app/                   # Expo Router screens
│   └── components/            # UI components
├── apps/api/                  # Market data API
│   └── src/providers/         # Polygon + mock providers
└── docs/ARCHITECTURE.md       # Detailed architecture
```

## Next steps

1. **Wire live data into mobile** — connect calculator screens to pre-fill stock price/IV from API
2. **Add Option Modeler** — multi-leg portfolio builder (projectoption premium feature)
3. **IV Screener** — backend job to pre-compute IV rank/percentile for 300+ tickers
4. **Auth + saved portfolios** — Supabase or Firebase for user accounts
5. **App Store deployment** — EAS Build for iOS/Android submission

## License

Private — All rights reserved.
