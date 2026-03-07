import { describe, it, expect, vi } from "vitest";
import type { CompanyCardData } from "@/lib/sankey-data";
import type { DrillDownState } from "../drill-down-provider";
import { reorderCards } from "../company-grid";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { layout: _layout, transition: _transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

const makeCompany = (
  company: string,
  totalCount: number,
  roles: { role: string; count: number }[],
): CompanyCardData => ({
  company,
  totalCount,
  roles: roles.map((r) => ({
    ...r,
    seniority: "same" as const,
  })),
});

const companies: CompanyCardData[] = [
  makeCompany("Google", 10, [
    { role: "Engineer", count: 6 },
    { role: "Manager", count: 4 },
  ]),
  makeCompany("Meta", 8, [
    { role: "Designer", count: 5 },
    { role: "Engineer", count: 3 },
  ]),
  makeCompany("Apple", 5, [{ role: "Analyst", count: 5 }]),
];

const nullState: DrillDownState = {
  type: null,
  value: null,
  nodeIndex: null,
};

describe("reorderCards", () => {
  it("returns original order with all isPromoted=false and isDimmed=false when selection is null", () => {
    const result = reorderCards(companies, nullState);
    expect(result.map((r) => r.company.company)).toEqual([
      "Google",
      "Meta",
      "Apple",
    ]);
    expect(result.every((r) => !r.isPromoted && !r.isDimmed)).toBe(true);
  });

  it("promotes matching company to index 0 with isPromoted=true, others isDimmed=true", () => {
    const state: DrillDownState = {
      type: "company",
      value: "Meta",
      nodeIndex: 2,
    };
    const result = reorderCards(companies, state);
    expect(result[0].company.company).toBe("Meta");
    expect(result[0].isPromoted).toBe(true);
    expect(result[0].isDimmed).toBe(false);
    expect(result[1].isDimmed).toBe(true);
    expect(result[1].isPromoted).toBe(false);
    expect(result[2].isDimmed).toBe(true);
  });

  it("promotes all matching cards for role selection, sorted by matching role count descending", () => {
    const state: DrillDownState = {
      type: "role",
      value: "Engineer",
      nodeIndex: 5,
    };
    const result = reorderCards(companies, state);
    // Google has Engineer count=6, Meta has Engineer count=3
    expect(result[0].company.company).toBe("Google");
    expect(result[0].isPromoted).toBe(true);
    expect(result[1].company.company).toBe("Meta");
    expect(result[1].isPromoted).toBe(true);
    // Apple has no Engineer role -- isDimmed
    expect(result[2].company.company).toBe("Apple");
    expect(result[2].isDimmed).toBe(true);
    expect(result[2].isPromoted).toBe(false);
  });

  it("returns all cards with isDimmed=false when role selection matches nothing", () => {
    const state: DrillDownState = {
      type: "role",
      value: "NonExistentRole",
      nodeIndex: 99,
    };
    const result = reorderCards(companies, state);
    expect(result.every((r) => !r.isDimmed && !r.isPromoted)).toBe(true);
    // Original order preserved
    expect(result.map((r) => r.company.company)).toEqual([
      "Google",
      "Meta",
      "Apple",
    ]);
  });

  it("returns all cards with isDimmed=false when company selection matches nothing", () => {
    const state: DrillDownState = {
      type: "company",
      value: "NonExistentCompany",
      nodeIndex: 99,
    };
    const result = reorderCards(companies, state);
    expect(result.every((r) => !r.isDimmed && !r.isPromoted)).toBe(true);
  });
});
