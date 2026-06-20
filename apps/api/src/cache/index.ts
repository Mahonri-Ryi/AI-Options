import type { CacheAdapter } from '../types.js';

export class MemoryCache implements CacheAdapter {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export function createCache(redisUrl?: string): CacheAdapter {
  // Production: swap MemoryCache for Redis by setting REDIS_URL
  // Redis integration uses ioredis — connect at deploy time
  if (redisUrl) {
    console.warn('REDIS_URL set — using in-process cache for now. Wire ioredis in production.');
  }
  return new MemoryCache();
}

export async function cached<T>(
  cache: CacheAdapter,
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const existing = await cache.get<T>(key);
  if (existing) return existing;

  const value = await loader();
  await cache.set(key, value, ttlSeconds);
  return value;
}
