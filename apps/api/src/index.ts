import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { cached, createCache } from './cache/index.js';
import { createMarketDataProvider } from './providers/market-data.js';

const PORT = Number(process.env.PORT ?? 8001);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = Fastify({
  logger: true,
});

const cache = createCache(process.env.REDIS_URL);
const marketData = createMarketDataProvider();

await app.register(cors, {
  origin: true,
});

await app.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute',
});

app.get('/health', async () => ({
  status: 'ok',
  provider: process.env.POLYGON_API_KEY ? 'polygon' : 'mock',
  timestamp: new Date().toISOString(),
}));

app.get('/api/v1/quote/:symbol', async (request) => {
  const { symbol } = request.params as { symbol: string };
  return cached(cache, `quote:${symbol.toUpperCase()}`, 15, () =>
    marketData.getQuote(symbol),
  );
});

app.get('/api/v1/options/:symbol/chain', async (request) => {
  const { symbol } = request.params as { symbol: string };
  const { expiration } = request.query as { expiration?: string };
  const cacheKey = `chain:${symbol.toUpperCase()}:${expiration ?? 'all'}`;

  return cached(cache, cacheKey, 60, () => marketData.getOptionChain(symbol, expiration));
});

app.get('/api/v1/search', async (request) => {
  const { q } = request.query as { q?: string };
  if (!q || q.length < 1) {
    return { results: [] };
  }

  const results = await cached(cache, `search:${q.toLowerCase()}`, 300, () =>
    marketData.searchSymbols(q),
  );
  return { results };
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  reply.status(500).send({
    error: 'Internal server error',
    message: error instanceof Error ? error.message : 'Unknown error',
  });
});

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`AI Options API listening on http://${HOST}:${PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
