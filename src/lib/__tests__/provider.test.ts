import { describe, expect, it } from "vitest";
import { MockProvider } from "../data/providers/mock";
import type { DataProvider, DetailedSearchResult } from "../data/types";

describe("MockProvider", () => {
  const provider = new MockProvider();

  it("satisfies the DataProvider interface", () => {
    const p: DataProvider = provider;
    expect(p.name).toBe("mock");
    expect(typeof p.search).toBe("function");
    expect(typeof p.healthCheck).toBe("function");
  });

  it("healthCheck returns true", async () => {
    const result = await provider.healthCheck();
    expect(result).toBe(true);
  });

  it("search returns CareerMigration[] with length > 0 for valid input", async () => {
    const results = await provider.search({
      company: "Google",
      role: "Software Engineer",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("sourceCompany");
    expect(results[0]).toHaveProperty("sourceRole");
    expect(results[0]).toHaveProperty("destinationCompany");
    expect(results[0]).toHaveProperty("destinationRole");
    expect(results[0]).toHaveProperty("count");
  });

  it("returns deterministic results for the same input", async () => {
    const results1 = await provider.search({
      company: "Google",
      role: "Software Engineer",
    });
    const results2 = await provider.search({
      company: "Google",
      role: "Software Engineer",
    });
    expect(results1).toEqual(results2);
  });

  it("returns results with the correct source company", async () => {
    const results = await provider.search({
      company: "McKinsey",
      role: "Management Consultant",
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.sourceCompany).toBe("McKinsey");
      expect(r.sourceRole).toBeTruthy();
    }
  });

  it("returns multiple roles per company", async () => {
    const results = await provider.search({
      company: "Meta",
      role: "Product Manager",
    });
    expect(results.length).toBeGreaterThanOrEqual(6);
    // At least some company should have multiple roles
    const byCompany = new Map<string, number>();
    for (const r of results) {
      byCompany.set(r.destinationCompany, (byCompany.get(r.destinationCompany) ?? 0) + 1);
    }
    const maxRoles = Math.max(...byCompany.values());
    expect(maxRoles).toBeGreaterThan(1);
  });
});

describe("MockProvider searchDetailed", () => {
  const provider = new MockProvider();
  const params = { company: "Google", role: "Software Engineer" };

  it("returns a DetailedSearchResult with both migrations and leavers", async () => {
    const result = await provider.searchDetailed!(params);
    expect(result).toHaveProperty("migrations");
    expect(result).toHaveProperty("leavers");
    expect(result.migrations.length).toBeGreaterThan(0);
    expect(result.leavers.length).toBeGreaterThan(0);
  });

  it("searchDetailed migrations match what search() returns", async () => {
    const searchResult = await provider.search(params);
    const detailedResult = await provider.searchDetailed!(params);
    expect(detailedResult.migrations).toEqual(searchResult);
  });

  it("each migration has 5-10 associated leavers", async () => {
    const result = await provider.searchDetailed!(params);
    // Group leavers by destination company + role
    const migrationKeys = result.migrations.map(
      (m) => `${m.destinationCompany.toLowerCase()}:${m.destinationRole.toLowerCase()}`,
    );
    for (const key of migrationKeys) {
      const leaversForMigration = result.leavers.filter(
        (l) =>
          `${l.destinationCompany.toLowerCase()}:${l.destinationRole.toLowerCase()}` === key,
      );
      expect(leaversForMigration.length).toBeGreaterThanOrEqual(5);
      expect(leaversForMigration.length).toBeLessThanOrEqual(10);
    }
  });

  it("each leaver has 2-4 positions in their career history", async () => {
    const result = await provider.searchDetailed!(params);
    for (const leaver of result.leavers) {
      expect(leaver.positions.length).toBeGreaterThanOrEqual(2);
      expect(leaver.positions.length).toBeLessThanOrEqual(4);
    }
  });

  it("leaver names follow 'Test User N' pattern", async () => {
    const result = await provider.searchDetailed!(params);
    for (const leaver of result.leavers) {
      expect(leaver.name).toMatch(/^Test User \d+$/);
    }
  });

  it("each leaver has a linkedinUrl matching pattern", async () => {
    const result = await provider.searchDetailed!(params);
    for (const leaver of result.leavers) {
      expect(leaver.linkedinUrl).toMatch(/^https:\/\/linkedin\.com\/in\/test-user-\d+$/);
    }
  });

  it("leaver destinationCompany and destinationRole match their associated migration", async () => {
    const result = await provider.searchDetailed!(params);
    const migrationKeys = new Set(
      result.migrations.map(
        (m) => `${m.destinationCompany.toLowerCase()}:${m.destinationRole.toLowerCase()}`,
      ),
    );
    for (const leaver of result.leavers) {
      const key = `${leaver.destinationCompany.toLowerCase()}:${leaver.destinationRole.toLowerCase()}`;
      expect(migrationKeys.has(key)).toBe(true);
    }
  });

  it("searchDetailed is deterministic (same input produces same output)", async () => {
    const result1 = await provider.searchDetailed!(params);
    const result2 = await provider.searchDetailed!(params);
    expect(result1).toEqual(result2);
  });

  it("first position's company matches leaver's destinationCompany", async () => {
    const result = await provider.searchDetailed!(params);
    for (const leaver of result.leavers) {
      expect(leaver.positions[0].company).toBe(leaver.destinationCompany);
    }
  });
});
