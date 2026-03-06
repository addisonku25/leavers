import { describe, expect, it, vi } from "vitest";
import { buildCacheKey, getCachedOrFetch } from "../cache/cache-manager";
import type { CareerMigration, DataProvider } from "../data/types";

// Mock Redis
vi.mock("../cache/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock DB
vi.mock("../db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => []),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: "test-id" }]),
      })),
    })),
  },
}));

describe("buildCacheKey", () => {
  it("normalizes to lowercase", () => {
    expect(buildCacheKey({ company: "Google", role: "SWE" })).toBe("google:swe");
  });

  it("trims whitespace", () => {
    expect(buildCacheKey({ company: " Google ", role: " SWE " })).toBe("google:swe");
  });

  it("collapses internal whitespace", () => {
    expect(buildCacheKey({ company: "Google  Inc", role: "Software  Engineer" })).toBe(
      "google inc:software engineer",
    );
  });

  it("produces same key for different casings", () => {
    const key1 = buildCacheKey({ company: "Google", role: "SWE" });
    const key2 = buildCacheKey({ company: "google", role: "swe" });
    const key3 = buildCacheKey({ company: " Google ", role: " SWE " });
    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
  });
});

describe("getCachedOrFetch", () => {
  const mockMigrations: CareerMigration[] = [
    {
      sourceCompany: "Google",
      sourceRole: "SWE",
      destinationCompany: "Meta",
      destinationRole: "Senior SWE",
      count: 5,
    },
  ];

  const mockProvider: DataProvider = {
    name: "mock",
    search: vi.fn().mockResolvedValue(mockMigrations),
    healthCheck: vi.fn().mockResolvedValue(true),
  };

  it("returns Redis-cached result when available (no DB or provider calls)", async () => {
    const { redis } = await import("../cache/redis");
    vi.mocked(redis?.get).mockResolvedValueOnce(mockMigrations);

    const result = await getCachedOrFetch({ company: "Google", role: "SWE" }, mockProvider);

    expect(result).toEqual(mockMigrations);
    expect(mockProvider.search).not.toHaveBeenCalled();
  });

  it("calls provider.search when both caches miss and stores in both", async () => {
    const { redis } = await import("../cache/redis");
    vi.mocked(redis?.get).mockResolvedValueOnce(null);
    vi.mocked(mockProvider.search).mockResolvedValueOnce(mockMigrations);

    const result = await getCachedOrFetch({ company: "Google", role: "SWE" }, mockProvider);

    expect(result).toEqual(mockMigrations);
    expect(mockProvider.search).toHaveBeenCalled();
    expect(redis?.set).toHaveBeenCalled();
  });
});
