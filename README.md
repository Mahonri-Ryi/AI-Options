# AI Options

Professional options calculators for iOS, Android, and web. Model profit and loss for every major strategy before you trade.

**Live preview:** Once GitHub Pages is enabled, the web app is available at  
`https://<your-username>.github.io/AI-Options/`

## What's included

| Package | Purpose |
|---------|---------|
| `packages/options-core` | Shared Black-Scholes math, Greeks, IV solver, and all 20 strategy calculators |
| `apps/web` | Web app (deployed to GitHub Pages) |
| `apps/mobile` | Expo React Native app (iOS + Android) |
| `apps/api` | Fastify market-data API with caching and rate limiting |

## Calculators (20 total)

- **Single-leg:** Long Call, Long Put, Short Call, Short Put
- **Vertical spreads:** Bull Call, Bull Put, Bear Put, Bear Call
- **Income:** Covered Call, Cash-Secured Put, Poor Man's Covered Call
- **Volatility:** Straddle, Strangle, Iron Condor, Iron Butterfly
- **Pricing & Greeks:** Options Pricing, Implied Volatility, Theta Decay, Expected Move

## Quick start

```bash
npm install
npm test           # 96 calculation accuracy tests
npm run web        # Web dev server at http://localhost:5173
npm run mobile     # Expo dev server
npm run api        # API on :8001 (mock data without POLYGON_API_KEY)
```

See `docs/TESTING.md` for details on the test suite.

### GitHub Pages setup

1. Go to **Settings → Pages** in your GitHub repo
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Select the **`gh-pages`** branch and **`/ (root)`** folder
4. Push to `main` (or this feature branch) — the workflow builds and deploys automatically
5. Your app will be live at: **https://mahonri-ryi.github.io/AI-Options/**

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Web / Mobile   │────▶│   Fastify API    │────▶│  Polygon.io     │
│                 │     │  + cache layer   │     │  (market data)  │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  options-core   │  ← All P/L math runs on-device (zero latency)
└─────────────────┘
```

| Layer | Strategy |
|-------|----------|
| Calculations | On-device via `options-core` — no server load |
| Market data | Cached API proxy (15s quotes, 60s chains) |
| Web | Static Vite build on GitHub Pages |

See `docs/ARCHITECTURE.md` for full details.

## Environment variables

```bash
# apps/api
POLYGON_API_KEY=your_key_here   # Optional — uses mock data if unset
REDIS_URL=redis://localhost:6379  # Optional — uses in-memory cache if unset
PORT=8001
```

## Project structure

```
ai-options/
├── packages/options-core/     # Shared math library
├── apps/web/                  # GitHub Pages web app
├── apps/mobile/               # Expo React Native app
├── apps/api/                  # Market data API
└── docs/ARCHITECTURE.md
```

## License

Private — All rights reserved.
