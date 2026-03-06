import { describe, expect, it } from "vitest";
import { MockProvider } from "../data/providers/mock";
import type { DataProvider } from "../data/types";

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
