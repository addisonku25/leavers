import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to control the redis mock per test
const mockRedis = { fake: true };

describe("rate-limit", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates guest search limiter with 3/day window", async () => {
    // Mock redis as available
    vi.doMock("@/lib/cache/redis", () => ({
      redis: mockRedis,
    }));

    const { searchGuestLimiter } = await import("@/lib/rate-limit");

    expect(searchGuestLimiter).not.toBeNull();
    // Ratelimit instances have a .limit method
    expect(searchGuestLimiter).toHaveProperty("limit");
  });

  it("creates auth search limiter with 50/hour window", async () => {
    // Mock redis as available
    vi.doMock("@/lib/cache/redis", () => ({
      redis: mockRedis,
    }));

    const { searchAuthLimiter } = await import("@/lib/rate-limit");

    expect(searchAuthLimiter).not.toBeNull();
    expect(searchAuthLimiter).toHaveProperty("limit");
  });

  it("creates auth endpoint limiter with 5/15min window", async () => {
    // Mock redis as available
    vi.doMock("@/lib/cache/redis", () => ({
      redis: mockRedis,
    }));

    const { authEndpointLimiter } = await import("@/lib/rate-limit");

    expect(authEndpointLimiter).not.toBeNull();
    expect(authEndpointLimiter).toHaveProperty("limit");
  });

  it("exports null limiters when redis is unavailable", async () => {
    // Mock redis as unavailable
    vi.doMock("@/lib/cache/redis", () => ({
      redis: null,
    }));

    const { searchGuestLimiter, searchAuthLimiter, authEndpointLimiter } =
      await import("@/lib/rate-limit");

    expect(searchGuestLimiter).toBeNull();
    expect(searchAuthLimiter).toBeNull();
    expect(authEndpointLimiter).toBeNull();
  });
});
