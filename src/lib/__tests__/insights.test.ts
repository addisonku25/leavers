import { describe, expect, it } from "vitest";
import {
  computeTopDestinations,
  type TopDestination,
} from "../insights";
import type { MigrationRecord } from "../sankey-data";

describe("computeTopDestinations", () => {
  it("ranks companies by headcount with percentages", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "SWE", count: 10 },
      { destinationCompany: "Meta", destinationRole: "SWE", count: 5 },
      { destinationCompany: "Apple", destinationRole: "PM", count: 3 },
    ];
    const result = computeTopDestinations(migrations);
    expect(result).toEqual([
      { company: "Google", percentage: 56 },
      { company: "Meta", percentage: 28 },
      { company: "Apple", percentage: 17 },
    ]);
  });

  it("returns only top 5 when more than 5 companies", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "R", count: 10 },
      { destinationCompany: "B", destinationRole: "R", count: 9 },
      { destinationCompany: "C", destinationRole: "R", count: 8 },
      { destinationCompany: "D", destinationRole: "R", count: 7 },
      { destinationCompany: "E", destinationRole: "R", count: 6 },
      { destinationCompany: "F", destinationRole: "R", count: 5 },
      { destinationCompany: "G", destinationRole: "R", count: 4 },
      { destinationCompany: "H", destinationRole: "R", count: 3 },
    ];
    const result = computeTopDestinations(migrations);
    expect(result).toHaveLength(5);
    expect(result[0].company).toBe("A");
    expect(result[4].company).toBe("E");
  });

  it("returns empty array for empty migrations", () => {
    expect(computeTopDestinations([])).toEqual([]);
  });

  it("returns [100%] for single company", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "SWE", count: 5 },
    ];
    const result = computeTopDestinations(migrations);
    expect(result).toEqual([{ company: "Google", percentage: 100 }]);
  });

  it("uses Math.round for percentages (integer results)", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "R", count: 1 },
      { destinationCompany: "B", destinationRole: "R", count: 2 },
    ];
    const result = computeTopDestinations(migrations);
    // 1/3 = 33.33 -> 33, 2/3 = 66.67 -> 67
    expect(result[0].percentage).toBe(67);
    expect(result[1].percentage).toBe(33);
    // Verify integers
    for (const d of result) {
      expect(Number.isInteger(d.percentage)).toBe(true);
    }
  });

  it("handles all migrations to same company as 100%", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "SWE", count: 10 },
      { destinationCompany: "Google", destinationRole: "PM", count: 5 },
    ];
    const result = computeTopDestinations(migrations);
    expect(result).toEqual([{ company: "Google", percentage: 100 }]);
  });

  it("aggregates multiple records for the same company", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "SWE", count: 5 },
      { destinationCompany: "Google", destinationRole: "PM", count: 5 },
      { destinationCompany: "Meta", destinationRole: "SWE", count: 10 },
    ];
    const result = computeTopDestinations(migrations);
    expect(result).toHaveLength(2);
    // Both have 50% -- order among ties is not guaranteed
    const companies = result.map((d) => d.company).sort();
    expect(companies).toEqual(["Google", "Meta"]);
    expect(result[0].percentage).toBe(50);
    expect(result[1].percentage).toBe(50);
  });

  it("respects custom limit parameter", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "R", count: 10 },
      { destinationCompany: "B", destinationRole: "R", count: 5 },
      { destinationCompany: "C", destinationRole: "R", count: 3 },
    ];
    const result = computeTopDestinations(migrations, 2);
    expect(result).toHaveLength(2);
  });
});
