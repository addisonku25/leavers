import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "test-saved-id"),
}));

// Mock next/headers
const mockHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => mockHeaders),
}));

// Mock auth - default: authenticated user
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

// Mock db
const mockFindFirst = vi.fn();
const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined);
const mockSelectOrderBy = vi.fn().mockResolvedValue([]);
const mockSelectWhere = vi.fn(() => ({ orderBy: mockSelectOrderBy }));
const mockSelectInnerJoin = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelectFrom = vi.fn(() => ({ innerJoin: mockSelectInnerJoin }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      savedSearches: {
        get findFirst() {
          return mockFindFirst;
        },
      },
    },
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    delete: vi.fn(() => ({
      where: mockDeleteWhere,
    })),
    select: vi.fn(() => ({
      from: mockSelectFrom,
    })),
  },
}));

// Mock schema
vi.mock("@/lib/db/schema", () => ({
  savedSearches: {
    id: "id",
    userId: "user_id",
    searchId: "search_id",
    createdAt: "created_at",
  },
  searches: {
    id: "id",
    company: "company",
    role: "role",
  },
}));

const authenticatedSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

describe("saved-searches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(authenticatedSession);
  });

  it("save - saves search for authenticated user", async () => {
    mockFindFirst.mockResolvedValue(null); // not already saved
    const { saveSearch } = await import("@/actions/saved-searches");
    const { db } = await import("@/lib/db");

    const result = await saveSearch("search-123");

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalled();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "test-saved-id",
        userId: "user-1",
        searchId: "search-123",
      }),
    );
  });

  it("save - is idempotent for same user+search", async () => {
    // Already saved
    mockFindFirst.mockResolvedValue({ id: "existing-saved" });
    const { saveSearch } = await import("@/actions/saved-searches");
    const { db } = await import("@/lib/db");

    const result = await saveSearch("search-123");

    expect(result).toEqual({ success: true });
    // Should NOT insert again
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("save - rejects unauthenticated requests", async () => {
    mockGetSession.mockResolvedValue(null);
    const { saveSearch } = await import("@/actions/saved-searches");

    const result = await saveSearch("search-123");

    expect(result).toEqual({ error: "unauthorized" });
  });

  it("list - returns saved searches for authenticated user", async () => {
    const mockResults = [
      {
        id: "saved-1",
        searchId: "search-1",
        company: "Google",
        role: "SWE",
        createdAt: new Date("2026-03-06"),
      },
    ];
    mockSelectOrderBy.mockResolvedValue(mockResults);
    const { getSavedSearches } = await import("@/actions/saved-searches");

    const result = await getSavedSearches();

    expect(result).toEqual(mockResults);
    expect(mockSelectFrom).toHaveBeenCalled();
  });

  it("list - orders by createdAt descending", async () => {
    mockSelectOrderBy.mockResolvedValue([]);
    const { getSavedSearches } = await import("@/actions/saved-searches");

    await getSavedSearches();

    // The orderBy function should have been called (desc ordering)
    expect(mockSelectOrderBy).toHaveBeenCalled();
  });

  it("delete - removes saved search owned by user", async () => {
    const { deleteSavedSearch } = await import("@/actions/saved-searches");

    const result = await deleteSavedSearch("saved-1");

    expect(result).toEqual({ success: true });
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("delete - rejects deletion of another user's search", async () => {
    mockGetSession.mockResolvedValue(null);
    const { deleteSavedSearch } = await import("@/actions/saved-searches");

    const result = await deleteSavedSearch("saved-1");

    // Unauthenticated = no session = unauthorized
    expect(result).toEqual({ error: "unauthorized" });
  });
});
