import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./cache/redis";

/**
 * Rate limiter for guest (unauthenticated) search requests.
 * 3 searches per day per IP address.
 */
export const searchGuestLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      prefix: "rl:search:guest",
    })
  : null;

/**
 * Rate limiter for authenticated search requests.
 * 50 searches per hour per user ID.
 */
export const searchAuthLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"),
      prefix: "rl:search:auth",
    })
  : null;

/**
 * Rate limiter for auth endpoint requests (login, signup).
 * 5 attempts per 15 minutes per IP address.
 */
export const authEndpointLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:auth:endpoint",
    })
  : null;
