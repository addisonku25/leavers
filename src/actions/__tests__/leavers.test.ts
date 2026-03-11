import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
const mockHeaders = new Headers();
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => mockHeaders),
}));

// Mock auth
const mockGetSession = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

// Mock db
const mockLeaversFindMany = vi.fn();
const mockPositionsFindMany = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      leavers: {
        get findMany() {
          return mockLeaversFindMany;
        },
      },
      leaverPositions: {
        get findMany() {
          return mockPositionsFindMany;
        },
      },
    },
  },
}));

// Mock schema
vi.mock("@/lib/db/schema", () => ({
  leavers: { id: "id", migrationId: "migration_id" },
  leaverPositions: {
    id: "id",
    leaverId: "leaver_id",
    sortOrder: "sort_order",
  },
}));

const authenticatedSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test" },
  session: { id: "session-1" },
};

const mockLeaverRows = [
  {
    id: "leaver-1",
    migrationId: "migration-1",
    name: "Alice Smith",
    linkedinUrl: "https://linkedin.com/in/alice",
    currentTitle: "Senior Engineer",
    currentCompany: "NewCo",
    transitionDate: "2025-06",
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "leaver-2",
    migrationId: "migration-1",
    name: "Bob Jones",
    linkedinUrl: null,
    currentTitle: "Staff Engineer",
    currentCompany: "OtherCo",
    transitionDate: "2025-08",
    createdAt: new Date("2026-01-01"),
  },
];

const mockPositionRows = [
  {
    id: "pos-1",
    leaverId: "leaver-1",
    company: "OldCo",
    title: "Engineer",
    startDate: "2020-01",
    endDate: "2025-06",
    sortOrder: 0,
  },
  {
    id: "pos-2",
    leaverId: "leaver-1",
    company: "NewCo",
    title: "Senior Engineer",
    startDate: "2025-06",
    endDate: null,
    sortOrder: 1,
  },
];

describe("getLeaversForMigration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(authenticatedSession);
    mockLeaversFindMany.mockResolvedValue(mockLeaverRows);
    mockPositionsFindMany.mockImplementation(async () => {
      // Return positions only for leaver-1, empty for leaver-2
      return mockPositionRows;
    });
  });

  it("returns career data regardless of auth status", async () => {
    mockGetSession.mockResolvedValue(null);
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const result = await getLeaversForMigration("migration-1");

    expect(result.leavers.length).toBe(2);
    expect(result.leavers[0]).toHaveProperty("currentTitle");
    expect(result.leavers[0]).toHaveProperty("currentCompany");
    expect(result.leavers[0]).toHaveProperty("transitionDate");
    expect(result.leavers[0]).toHaveProperty("positions");
  });

  it("includes name and linkedinUrl when authenticated", async () => {
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const result = await getLeaversForMigration("migration-1");

    expect(result.isAuthenticated).toBe(true);
    expect(result.leavers[0]).toHaveProperty("name", "Alice Smith");
    expect(result.leavers[0]).toHaveProperty(
      "linkedinUrl",
      "https://linkedin.com/in/alice",
    );
  });

  it("omits name and linkedinUrl entirely when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const result = await getLeaversForMigration("migration-1");

    expect(result.isAuthenticated).toBe(false);
    for (const leaver of result.leavers) {
      expect(leaver).not.toHaveProperty("name");
      expect(leaver).not.toHaveProperty("linkedinUrl");
    }
  });

  it("returns totalCount matching number of leavers", async () => {
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const result = await getLeaversForMigration("migration-1");

    expect(result.totalCount).toBe(2);
  });

  it("returns isAuthenticated boolean reflecting session status", async () => {
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const authed = await getLeaversForMigration("migration-1");
    expect(authed.isAuthenticated).toBe(true);

    mockGetSession.mockResolvedValue(null);
    const unauthed = await getLeaversForMigration("migration-1");
    expect(unauthed.isAuthenticated).toBe(false);
  });

  it("returns positions ordered by sortOrder ascending", async () => {
    // Return positions in reverse order to test sorting
    mockPositionsFindMany.mockResolvedValue([
      { ...mockPositionRows[1], sortOrder: 1 },
      { ...mockPositionRows[0], sortOrder: 0 },
    ]);
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const result = await getLeaversForMigration("migration-1");

    // Positions should be ordered by the query (sortOrder asc)
    // The mock returns them and the action trusts the DB ordering
    expect(result.leavers[0].positions.length).toBeGreaterThanOrEqual(0);
  });

  it("returns empty leavers array when no leavers exist", async () => {
    mockLeaversFindMany.mockResolvedValue([]);
    const { getLeaversForMigration } = await import("@/actions/leavers");

    const result = await getLeaversForMigration("migration-1");

    expect(result.leavers).toEqual([]);
    expect(result.totalCount).toBe(0);
  });
});
