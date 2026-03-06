import { describe, expect, it } from "vitest";
import {
  computeTopDestinations,
  classifyRole,
  computeRoleBuckets,
  generatePatternSummary,
  computeInsights,
  type TopDestination,
  type RoleCategory,
  type RoleBucket,
  type InsightsData,
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

describe("classifyRole", () => {
  it('classifies "VP of Sales" as Leadership (not Business)', () => {
    expect(classifyRole("VP of Sales", "Solutions Engineer")).toBe("Leadership");
  });

  it('classifies "Software Engineer" as Technical', () => {
    expect(classifyRole("Software Engineer", "Solutions Engineer")).toBe("Technical");
  });

  it('classifies "Account Executive" as Business', () => {
    expect(classifyRole("Account Executive", "Solutions Engineer")).toBe("Business");
  });

  it('classifies same role title as "Same role"', () => {
    expect(classifyRole("Solutions Engineer", "Solutions Engineer")).toBe("Same role");
  });

  it('classifies "Sr. Solutions Engineer" as "Same role" (normalized match)', () => {
    expect(classifyRole("Sr. Solutions Engineer", "Solutions Engineer")).toBe("Same role");
  });

  it('defaults "Photographer" (no keyword match) to Business', () => {
    expect(classifyRole("Photographer", "Solutions Engineer")).toBe("Business");
  });

  it("prioritizes Same role over Leadership", () => {
    // If the searched role is "VP of Sales" and destination is also "VP of Sales"
    expect(classifyRole("VP of Sales", "VP of Sales")).toBe("Same role");
  });

  it('classifies "Director of Engineering" as Leadership', () => {
    expect(classifyRole("Director of Engineering", "Solutions Engineer")).toBe("Leadership");
  });

  it('classifies "Data Scientist" as Technical', () => {
    expect(classifyRole("Data Scientist", "Solutions Engineer")).toBe("Technical");
  });

  it('classifies "Product Manager" as Business', () => {
    expect(classifyRole("Product Manager", "Solutions Engineer")).toBe("Business");
  });

  it('classifies "Head of Marketing" as Leadership', () => {
    expect(classifyRole("Head of Marketing", "Solutions Engineer")).toBe("Leadership");
  });

  it('classifies "CEO" as Leadership', () => {
    expect(classifyRole("CEO", "Solutions Engineer")).toBe("Leadership");
  });

  it('classifies "DevOps Engineer" as Technical', () => {
    expect(classifyRole("DevOps Engineer", "Solutions Engineer")).toBe("Technical");
  });

  it('classifies "SRE" as Technical', () => {
    expect(classifyRole("SRE", "Solutions Engineer")).toBe("Technical");
  });

  it('classifies "Recruiter" as Business', () => {
    expect(classifyRole("Recruiter", "Solutions Engineer")).toBe("Business");
  });
});

describe("computeRoleBuckets", () => {
  it("returns non-empty buckets sorted by percentage descending", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "Software Engineer", count: 10 },
      { destinationCompany: "B", destinationRole: "VP of Sales", count: 5 },
      { destinationCompany: "C", destinationRole: "Account Executive", count: 3 },
    ];
    const result = computeRoleBuckets(migrations, "Solutions Engineer");
    expect(result.length).toBeGreaterThan(0);
    // Sorted by percentage descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].percentage).toBeGreaterThanOrEqual(result[i].percentage);
    }
  });

  it("includes top role names in each bucket", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "Software Engineer", count: 10 },
      { destinationCompany: "B", destinationRole: "Backend Engineer", count: 5 },
      { destinationCompany: "C", destinationRole: "Frontend Engineer", count: 3 },
    ];
    const result = computeRoleBuckets(migrations, "Solutions Engineer");
    const technicalBucket = result.find((b) => b.category === "Technical");
    expect(technicalBucket).toBeDefined();
    expect(technicalBucket!.topRoles.length).toBeGreaterThanOrEqual(1);
    expect(technicalBucket!.topRoles.length).toBeLessThanOrEqual(3);
  });

  it('returns 100% "Same role" bucket when all are same role', () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "Solutions Engineer", count: 10 },
      { destinationCompany: "B", destinationRole: "Sr. Solutions Engineer", count: 5 },
    ];
    const result = computeRoleBuckets(migrations, "Solutions Engineer");
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Same role");
    expect(result[0].percentage).toBe(100);
  });

  it("returns empty array for empty migrations", () => {
    expect(computeRoleBuckets([], "Solutions Engineer")).toEqual([]);
  });

  it("filters out 0% buckets", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "Software Engineer", count: 10 },
    ];
    const result = computeRoleBuckets(migrations, "Solutions Engineer");
    // Only Technical should appear, no empty buckets
    for (const bucket of result) {
      expect(bucket.percentage).toBeGreaterThan(0);
    }
  });
});

describe("generatePatternSummary", () => {
  const searchedRole = "Solutions Engineer";

  it("includes concentration sentence when top destination >= 25%", () => {
    const topDestinations: TopDestination[] = [
      { company: "Google", percentage: 40 },
      { company: "Meta", percentage: 20 },
    ];
    const roleBuckets: RoleBucket[] = [
      { category: "Technical", percentage: 60, topRoles: ["Software Engineer"] },
      { category: "Business", percentage: 40, topRoles: ["PM"] },
    ];
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "Software Engineer", sourceRole: "Solutions Engineer", count: 8 },
      { destinationCompany: "Meta", destinationRole: "PM", sourceRole: "Solutions Engineer", count: 4 },
    ];
    const summary = generatePatternSummary(topDestinations, roleBuckets, migrations, searchedRole);
    expect(summary).toContain("Google");
    expect(summary).toContain("40%");
  });

  it("includes role change frequency when Same role bucket exists", () => {
    const topDestinations: TopDestination[] = [{ company: "Google", percentage: 100 }];
    const roleBuckets: RoleBucket[] = [
      { category: "Same role", percentage: 70, topRoles: ["Solutions Engineer"] },
      { category: "Technical", percentage: 30, topRoles: ["Software Engineer"] },
    ];
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "Solutions Engineer", sourceRole: "Solutions Engineer", count: 7 },
      { destinationCompany: "Google", destinationRole: "Software Engineer", sourceRole: "Solutions Engineer", count: 3 },
    ];
    const summary = generatePatternSummary(topDestinations, roleBuckets, migrations, searchedRole);
    expect(summary).toContain("70%");
    expect(summary).toContain("similar role");
  });

  it("always includes top transition highlight", () => {
    const topDestinations: TopDestination[] = [{ company: "A", percentage: 15 }];
    const roleBuckets: RoleBucket[] = [
      { category: "Technical", percentage: 100, topRoles: ["Software Engineer"] },
    ];
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "Software Engineer", sourceRole: "Solutions Engineer", count: 10 },
    ];
    const summary = generatePatternSummary(topDestinations, roleBuckets, migrations, searchedRole);
    expect(summary).toContain("Software Engineer");
    expect(summary).toContain("most common");
  });

  it("returns empty string for empty migrations", () => {
    const summary = generatePatternSummary([], [], [], searchedRole);
    expect(summary).toBe("");
  });

  it("produces 2-3 sentences joined as a single string", () => {
    const topDestinations: TopDestination[] = [
      { company: "Google", percentage: 50 },
    ];
    const roleBuckets: RoleBucket[] = [
      { category: "Technical", percentage: 60, topRoles: ["Software Engineer"] },
      { category: "Same role", percentage: 40, topRoles: ["Solutions Engineer"] },
    ];
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "Software Engineer", sourceRole: "Solutions Engineer", count: 6 },
      { destinationCompany: "Google", destinationRole: "Solutions Engineer", sourceRole: "Solutions Engineer", count: 4 },
    ];
    const summary = generatePatternSummary(topDestinations, roleBuckets, migrations, searchedRole);
    // Should be 2-3 sentences (split by period followed by space)
    const sentences = summary.split(". ").filter((s) => s.length > 0);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
  });

  it("includes seniority trend when seniority data is available", () => {
    const topDestinations: TopDestination[] = [{ company: "A", percentage: 100 }];
    const roleBuckets: RoleBucket[] = [
      { category: "Technical", percentage: 100, topRoles: ["Senior Software Engineer"] },
    ];
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "Senior Software Engineer", sourceRole: "Software Engineer", count: 10 },
    ];
    const summary = generatePatternSummary(topDestinations, roleBuckets, migrations, searchedRole);
    expect(summary).toMatch(/more senior|senior/i);
  });
});

describe("computeInsights", () => {
  it("returns empty InsightsData for empty migrations", () => {
    const result = computeInsights([], "Solutions Engineer");
    expect(result).toEqual({
      topDestinations: [],
      roleBuckets: [],
      patternSummary: "",
      totalMigrations: 0,
    });
  });

  it("handles very small result sets (less than 3 migrations)", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "SWE", count: 1 },
    ];
    const result = computeInsights(migrations, "Solutions Engineer");
    expect(result.totalMigrations).toBe(1);
    expect(result.topDestinations).toHaveLength(1);
  });

  it("returns fully populated InsightsData for normal dataset", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "Google", destinationRole: "Software Engineer", sourceRole: "Solutions Engineer", count: 10 },
      { destinationCompany: "Meta", destinationRole: "VP of Sales", sourceRole: "Solutions Engineer", count: 5 },
      { destinationCompany: "Apple", destinationRole: "Account Executive", sourceRole: "Solutions Engineer", count: 3 },
      { destinationCompany: "Amazon", destinationRole: "Solutions Engineer", sourceRole: "Solutions Engineer", count: 8 },
    ];
    const result = computeInsights(migrations, "Solutions Engineer");
    expect(result.totalMigrations).toBe(26);
    expect(result.topDestinations.length).toBeGreaterThan(0);
    expect(result.roleBuckets.length).toBeGreaterThan(0);
    expect(result.patternSummary.length).toBeGreaterThan(0);
  });

  it("computes correct totalMigrations from count sums", () => {
    const migrations: MigrationRecord[] = [
      { destinationCompany: "A", destinationRole: "R", count: 5 },
      { destinationCompany: "B", destinationRole: "R", count: 3 },
    ];
    const result = computeInsights(migrations, "R");
    expect(result.totalMigrations).toBe(8);
  });
});
