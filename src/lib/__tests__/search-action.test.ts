import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock nanoid before any imports that use it
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-search-id"),
}));

// Mock the database
const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockUpdateSetWhere = vi.fn().mockResolvedValue(undefined);
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateSetWhere }));
const mockSelectLimit = vi.fn().mockResolvedValue([]);
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    update: vi.fn(() => ({
      set: mockUpdateSet,
    })),
    select: vi.fn(() => ({
      from: mockSelectFrom,
    })),
    delete: vi.fn(() => ({
      where: mockDeleteWhere,
    })),
  },
}));

// Mock the schema
vi.mock("@/lib/db/schema", () => ({
  searches: { id: "id" },
  migrations: { id: "id" },
}));

// Mock the cache manager
const mockGetCachedOrFetch = vi.fn();
vi.mock("@/lib/cache/cache-manager", () => ({
  getCachedOrFetch: mockGetCachedOrFetch,
  buildCacheKey: vi.fn(({ company, role }: { company: string; role: string }) =>
    `${company.toLowerCase()}:${role.toLowerCase()}`
  ),
}));

// Mock the provider factory
vi.mock("@/lib/data/provider-factory", () => ({
  getProvider: vi.fn(() => ({
    name: "mock",
    search: vi.fn(),
    healthCheck: vi.fn(),
  })),
}));

// Mock next/headers
const mockHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => mockHeaders),
}));

// Mock auth - return null session (guest) by default
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(async () => null),
    },
  },
}));

// Mock rate limiters - disabled (null) for tests by default
vi.mock("@/lib/rate-limit", () => ({
  searchGuestLimiter: null,
  searchAuthLimiter: null,
}));

describe("searchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error for empty company", async () => {
    const { searchAction } = await import("@/actions/search");
    const formData = new FormData();
    formData.set("company", "");
    formData.set("role", "Software Engineer");

    const result = await searchAction(formData);

    expect(result).toBeDefined();
    expect(result?.error).toBeDefined();
  });

  it("returns validation error for empty role", async () => {
    const { searchAction } = await import("@/actions/search");
    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "");

    const result = await searchAction(formData);

    expect(result).toBeDefined();
    expect(result?.error).toBeDefined();
  });

  it("creates search record and calls cache pipeline for valid input", async () => {
    const { searchAction } = await import("@/actions/search");
    const { db } = await import("@/lib/db");

    mockGetCachedOrFetch.mockResolvedValueOnce([
      {
        sourceCompany: "Google",
        sourceRole: "Software Engineer",
        destinationCompany: "Meta",
        destinationRole: "Senior SWE",
        count: 5,
      },
    ]);

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "Software Engineer");

    const result = await searchAction(formData);

    expect(result).toEqual({ searchId: "test-search-id" });
    // Should have created a search record
    expect(db.insert).toHaveBeenCalled();
    // Should have called the cache pipeline
    expect(mockGetCachedOrFetch).toHaveBeenCalled();
  });

  it("updates search status to 'complete' on successful fetch", async () => {
    const { searchAction } = await import("@/actions/search");
    const { db } = await import("@/lib/db");

    mockGetCachedOrFetch.mockResolvedValueOnce([
      {
        sourceCompany: "Google",
        sourceRole: "SWE",
        destinationCompany: "Meta",
        destinationRole: "Senior SWE",
        count: 3,
      },
    ]);

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "SWE");

    const result = await searchAction(formData);

    expect(result).toEqual({ searchId: "test-search-id" });
    // Should update status to complete
    expect(db.update).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "complete" }),
    );
  });

  it("updates search status to 'error' on fetch failure", async () => {
    const { searchAction } = await import("@/actions/search");
    const { db } = await import("@/lib/db");

    mockGetCachedOrFetch.mockRejectedValueOnce(new Error("API failure"));

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "Software Engineer");

    const result = await searchAction(formData);

    expect(result?.error).toBeDefined();
    expect(db.update).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("returns searchId on success for client-side navigation", async () => {
    const { searchAction } = await import("@/actions/search");

    mockGetCachedOrFetch.mockResolvedValueOnce([
      {
        sourceCompany: "Google",
        sourceRole: "SWE",
        destinationCompany: "Meta",
        destinationRole: "Senior SWE",
        count: 3,
      },
    ]);

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "SWE");

    const result = await searchAction(formData);

    expect(result).toEqual({ searchId: "test-search-id" });
  });
});
