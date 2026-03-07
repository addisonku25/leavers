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
  leavers: { id: "id" },
  leaverPositions: { id: "id" },
}));

// Mock the cache manager
const mockGetCachedOrFetch = vi.fn();
vi.mock("@/lib/cache/cache-manager", () => ({
  getCachedOrFetch: mockGetCachedOrFetch,
  buildCacheKey: vi.fn(({ company, role }: { company: string; role: string }) =>
    `${company.toLowerCase()}:${role.toLowerCase()}`
  ),
}));

// Mock the provider factory - default provider has NO searchDetailed (backward compat tests)
const mockSearchDetailed = vi.fn();
const mockProviderSearch = vi.fn();
vi.mock("@/lib/data/provider-factory", () => ({
  getProvider: vi.fn(() => ({
    name: "mock",
    search: mockProviderSearch,
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

  it("stores leaver records when provider has searchDetailed", async () => {
    const { getProvider } = await import("@/lib/data/provider-factory");
    mockSearchDetailed.mockResolvedValueOnce({
      migrations: [
        {
          sourceCompany: "Google",
          sourceRole: "SWE",
          destinationCompany: "Meta",
          destinationRole: "Senior SWE",
          count: 3,
        },
      ],
      leavers: [
        {
          name: "Test User 1",
          linkedinUrl: "https://linkedin.com/in/test-user-1",
          currentTitle: "Senior SWE",
          currentCompany: "Meta",
          transitionDate: "2020-06",
          positions: [
            { company: "Meta", title: "Senior SWE", startDate: "2020-01" },
            { company: "Startup", title: "SWE", startDate: "2018-01", endDate: "2019-12" },
          ],
          destinationCompany: "Meta",
          destinationRole: "Senior SWE",
        },
      ],
    });
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      name: "mock",
      search: mockProviderSearch,
      searchDetailed: mockSearchDetailed,
      healthCheck: vi.fn(),
    });

    const { searchAction } = await import("@/actions/search");
    const { db } = await import("@/lib/db");

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "Software Engineer");

    const result = await searchAction(formData);

    expect(result).toEqual({ searchId: "test-search-id" });
    expect(mockSearchDetailed).toHaveBeenCalled();
    // db.insert called for: search record, migration, leaver, 2 positions = 5 calls
    expect(db.insert).toHaveBeenCalledTimes(5);
  });

  it("falls back to getCachedOrFetch when provider lacks searchDetailed", async () => {
    const { getProvider } = await import("@/lib/data/provider-factory");
    // Override to return provider WITHOUT searchDetailed
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      name: "basic",
      search: vi.fn(),
      healthCheck: vi.fn(),
    });

    mockGetCachedOrFetch.mockResolvedValueOnce([
      {
        sourceCompany: "Google",
        sourceRole: "SWE",
        destinationCompany: "Meta",
        destinationRole: "Senior SWE",
        count: 3,
      },
    ]);

    const { searchAction } = await import("@/actions/search");

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "Software Engineer");

    const result = await searchAction(formData);

    expect(result).toEqual({ searchId: "test-search-id" });
    expect(mockGetCachedOrFetch).toHaveBeenCalled();
  });

  it("caps leaver storage at 10 per migration", async () => {
    const { getProvider } = await import("@/lib/data/provider-factory");
    const migrations = [
      {
        sourceCompany: "Google",
        sourceRole: "SWE",
        destinationCompany: "Meta",
        destinationRole: "Senior SWE",
        count: 15,
      },
    ];
    const leavers = Array.from({ length: 12 }, (_, i) => ({
      name: `Test User ${i + 1}`,
      linkedinUrl: `https://linkedin.com/in/test-user-${i + 1}`,
      currentTitle: "Senior SWE",
      currentCompany: "Meta",
      transitionDate: "2020-06",
      positions: [{ company: "Meta", title: "Senior SWE", startDate: "2020-01" }],
      destinationCompany: "Meta",
      destinationRole: "Senior SWE",
    }));

    mockSearchDetailed.mockResolvedValueOnce({ migrations, leavers });
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      name: "mock",
      search: mockProviderSearch,
      searchDetailed: mockSearchDetailed,
      healthCheck: vi.fn(),
    });

    const { searchAction } = await import("@/actions/search");
    const { db } = await import("@/lib/db");

    const formData = new FormData();
    formData.set("company", "Google");
    formData.set("role", "Software Engineer");

    await searchAction(formData);

    // Count insert calls: 1 search + 1 migration + 10 leavers (capped) + 10 positions = 22
    const insertCalls = (db.insert as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(insertCalls).toBe(22);
  });
});
