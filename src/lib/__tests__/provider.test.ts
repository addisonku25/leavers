import { describe, expect, it } from "vitest";
import type { DataProvider } from "../data/types";
import { MockProvider } from "../data/providers/mock";

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

  it("returns results with the correct source company and role", async () => {
    const results = await provider.search({
      company: "McKinsey",
      role: "Management Consultant",
    });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.sourceCompany).toBe("McKinsey");
      expect(r.sourceRole).toBe("Management Consultant");
    }
  });

  it("returns 5-15 results per search", async () => {
    const results = await provider.search({
      company: "Meta",
      role: "Product Manager",
    });
    expect(results.length).toBeGreaterThanOrEqual(5);
    expect(results.length).toBeLessThanOrEqual(15);
  });
});
