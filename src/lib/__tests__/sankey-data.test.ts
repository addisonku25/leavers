import { describe, expect, it } from "vitest";
import {
  groupMigrationsForCards,
  buildSankeyData,
  type CompanyCardData,
  type SankeyData,
} from "../sankey-data";

// Helper to create migration records
function migration(
  destCompany: string,
  destRole: string,
  count: number,
  sourceRole = "",
) {
  return {
    destinationCompany: destCompany,
    destinationRole: destRole,
    sourceRole,
    count,
  };
}

describe("groupMigrationsForCards", () => {
  it("groups migrations by destination company with totalCount", () => {
    const migrations = [
      migration("Google", "Engineer", 5),
      migration("Google", "Senior Engineer", 3),
      migration("Meta", "PM", 10),
      migration("Apple", "Designer", 2),
    ];

    const result = groupMigrationsForCards(migrations, "Engineer");
    expect(result).toHaveLength(3);
    expect(result[0].company).toBe("Meta");
    expect(result[0].totalCount).toBe(10);
    expect(result[1].company).toBe("Google");
    expect(result[1].totalCount).toBe(8);
    expect(result[2].company).toBe("Apple");
    expect(result[2].totalCount).toBe(2);
  });

  it("sorts companies by totalCount descending", () => {
    const migrations = [
      migration("Small Co", "Dev", 1),
      migration("Big Co", "Dev", 100),
      migration("Mid Co", "Dev", 50),
    ];

    const result = groupMigrationsForCards(migrations, "Dev");
    expect(result.map((c) => c.company)).toEqual([
      "Big Co",
      "Mid Co",
      "Small Co",
    ]);
  });

  it("sorts roles within each company by count descending", () => {
    const migrations = [
      migration("Google", "Junior Dev", 2),
      migration("Google", "Senior Dev", 10),
      migration("Google", "Staff Dev", 5),
    ];

    const result = groupMigrationsForCards(migrations, "Dev");
    expect(result[0].roles.map((r) => r.role)).toEqual([
      "Senior Dev",
      "Staff Dev",
      "Junior Dev",
    ]);
  });

  it("includes seniority comparison for each role", () => {
    const migrations = [
      migration("Google", "Senior Engineer", 5, "Senior Engineer"),
      migration("Google", "VP of Engineering", 2, "VP of Engineering"),
    ];

    const result = groupMigrationsForCards(migrations, "Engineer");
    // Senior Engineer (3) vs searched Engineer (2) -> more-senior
    expect(result[0].roles[0].seniority).toBe("more-senior");
    // VP (7) vs searched Engineer (2) -> more-senior
    expect(result[0].roles[1].seniority).toBe("more-senior");
  });

  it("handles empty input", () => {
    const result = groupMigrationsForCards([], "Engineer");
    expect(result).toEqual([]);
  });
});

describe("buildSankeyData", () => {
  it("produces nodes with correct categories", () => {
    const migrations = [
      migration("Google", "Engineer", 5),
      migration("Meta", "PM", 3),
    ];

    const result = buildSankeyData(migrations, "Software Engineer");

    const sourceNodes = result.nodes.filter((n) => n.category === "source");
    const companyNodes = result.nodes.filter((n) => n.category === "company");
    const destNodes = result.nodes.filter(
      (n) => n.category === "destination",
    );

    expect(sourceNodes).toHaveLength(1);
    expect(sourceNodes[0].name).toBe("Software Engineer");
    expect(companyNodes).toHaveLength(2);
    expect(destNodes.length).toBeGreaterThanOrEqual(2);
  });

  it("limits to top 8 companies, groups remainder into Other", () => {
    const migrations = Array.from({ length: 10 }, (_, i) =>
      migration(`Company ${i}`, "Dev", 10 - i),
    );

    const result = buildSankeyData(migrations, "Dev");
    const companyNodes = result.nodes.filter((n) => n.category === "company");

    // 8 individual + 1 "Other" = 9
    expect(companyNodes).toHaveLength(9);
    const otherNode = companyNodes.find((n) => n.name.startsWith("Other"));
    expect(otherNode).toBeDefined();
    expect(otherNode!.name).toBe("Other (2 companies)");
  });

  it("limits to top 5 destination roles per company, groups remainder", () => {
    const migrations = Array.from({ length: 7 }, (_, i) =>
      migration("Google", `Role ${i}`, 10 - i),
    );

    const result = buildSankeyData(migrations, "Dev");
    const destNodes = result.nodes.filter((n) => n.category === "destination");

    // 5 individual + 1 "Other roles" = 6
    expect(destNodes).toHaveLength(6);
    const otherNode = destNodes.find((n) => n.name === "Other roles");
    expect(otherNode).toBeDefined();
  });

  it("returns empty nodes/links for empty input", () => {
    const result = buildSankeyData([], "Engineer");
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it("creates valid source-to-company links", () => {
    const migrations = [
      migration("Google", "Engineer", 5),
      migration("Google", "PM", 3),
      migration("Meta", "Designer", 7),
    ];

    const result = buildSankeyData(migrations, "Dev");

    // Source (index 0) -> Google should have value 8 (5+3)
    const sourceToGoogle = result.links.find(
      (l) =>
        l.source === 0 &&
        result.nodes[l.target].name === "Google",
    );
    expect(sourceToGoogle).toBeDefined();
    expect(sourceToGoogle!.value).toBe(8);

    // Source -> Meta should have value 7
    const sourceToMeta = result.links.find(
      (l) =>
        l.source === 0 &&
        result.nodes[l.target].name === "Meta",
    );
    expect(sourceToMeta).toBeDefined();
    expect(sourceToMeta!.value).toBe(7);
  });

  it("creates valid company-to-role links", () => {
    const migrations = [
      migration("Google", "Engineer", 5),
      migration("Google", "PM", 3),
    ];

    const result = buildSankeyData(migrations, "Dev");

    const googleIdx = result.nodes.findIndex(
      (n) => n.name === "Google" && n.category === "company",
    );
    const googleToRoleLinks = result.links.filter(
      (l) => l.source === googleIdx,
    );

    expect(googleToRoleLinks).toHaveLength(2);
    const totalValue = googleToRoleLinks.reduce((s, l) => s + l.value, 0);
    expect(totalValue).toBe(8);
  });

  it("contains no fields named name, email, linkedin, or profile (PRIV-01)", () => {
    const migrations = [
      migration("Google", "Engineer", 5, "Senior Engineer"),
    ];

    const result = buildSankeyData(migrations, "Engineer");
    const json = JSON.stringify(result);

    // These privacy-sensitive field names should not appear as keys
    // "name" is allowed as a node property name, but "email", "linkedin", "profile" should not
    expect(json).not.toContain('"email"');
    expect(json).not.toContain('"linkedin"');
    expect(json).not.toContain('"profile"');
  });
});
