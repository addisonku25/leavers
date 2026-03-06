import type { CareerMigration, DataProvider, MigrationSearchParams } from "../data/types";
import { redis } from "./redis";

const REDIS_TTL_SECONDS = 86400; // 24 hours

/**
 * Normalize search params into a deterministic cache key.
 * Lowercases, trims, and collapses internal whitespace.
 */
export function buildCacheKey(params: MigrationSearchParams): string {
  const company = params.company.toLowerCase().trim().replace(/\s+/g, " ");
  const role = params.role.toLowerCase().trim().replace(/\s+/g, " ");
  return `${company}:${role}`;
}

/**
 * Cache-aside orchestration: Redis (hot) -> Turso (persistent) -> Provider (live fetch).
 *
 * For now, implements Redis + Provider tiers. Turso tier will be wired when
 * the search server action is built (Plan 01-02), since it requires the full
 * DB insert/query flow with search IDs.
 */
export async function getCachedOrFetch(
  params: MigrationSearchParams,
  provider: DataProvider,
): Promise<CareerMigration[]> {
  const cacheKey = buildCacheKey(params);

  // Tier 1: Redis hot cache
  if (redis) {
    try {
      const redisResult = await redis.get<CareerMigration[]>(cacheKey);
      if (redisResult) {
        return redisResult;
      }
    } catch {
      // Redis failure should not block the request
      console.warn("Redis get failed, falling through to provider");
    }
  }

  // Tier 3: Live provider fetch (Tier 2 Turso lookup added in Plan 01-02)
  const results = await provider.search(params);

  // Store in Redis for future requests
  if (redis) {
    try {
      await redis.set(cacheKey, results, { ex: REDIS_TTL_SECONDS });
    } catch {
      console.warn("Redis set failed, continuing without cache");
    }
  }

  return results;
}
