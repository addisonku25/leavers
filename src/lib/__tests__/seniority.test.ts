import { describe, expect, it } from "vitest";
import {
  parseSeniorityLevel,
  compareSeniority,
  type SeniorityComparison,
} from "../seniority";

describe("parseSeniorityLevel", () => {
  it("returns 0 for intern", () => {
    expect(parseSeniorityLevel("intern")).toBe(0);
  });

  it("returns 0 for Intern (case-insensitive)", () => {
    expect(parseSeniorityLevel("Intern")).toBe(0);
  });

  it("returns 1 for Junior Analyst", () => {
    expect(parseSeniorityLevel("Junior Analyst")).toBe(1);
  });

  it("returns 2 for mid-level with no prefix (Solutions Engineer)", () => {
    expect(parseSeniorityLevel("Solutions Engineer")).toBe(2);
  });

  it("returns 3 for Senior Solutions Engineer", () => {
    expect(parseSeniorityLevel("Senior Solutions Engineer")).toBe(3);
  });

  it("returns 4 for Staff Engineer", () => {
    expect(parseSeniorityLevel("Staff Engineer")).toBe(4);
  });

  it("returns 5 for Principal Engineer", () => {
    expect(parseSeniorityLevel("Principal Engineer")).toBe(5);
  });

  it("returns 6 for Director of Engineering", () => {
    expect(parseSeniorityLevel("Director of Engineering")).toBe(6);
  });

  it("returns 7 for VP of Sales", () => {
    expect(parseSeniorityLevel("VP of Sales")).toBe(7);
  });

  it("returns 8 for SVP of Product", () => {
    expect(parseSeniorityLevel("SVP of Product")).toBe(8);
  });

  it("returns 9 for CEO", () => {
    expect(parseSeniorityLevel("CEO")).toBe(9);
  });

  it("returns 9 for Chief Technology Officer", () => {
    expect(parseSeniorityLevel("Chief Technology Officer")).toBe(9);
  });

  it("returns 2 for empty string (default)", () => {
    expect(parseSeniorityLevel("")).toBe(2);
  });

  it("returns 2 for title with no seniority prefix", () => {
    expect(parseSeniorityLevel("Data Analyst")).toBe(2);
  });

  it("handles mixed case", () => {
    expect(parseSeniorityLevel("SENIOR engineer")).toBe(3);
    expect(parseSeniorityLevel("junior developer")).toBe(1);
  });

  it("handles Lead as level 4", () => {
    expect(parseSeniorityLevel("Lead Engineer")).toBe(4);
  });
});

describe("compareSeniority", () => {
  it('returns "more-senior" when source role is more senior', () => {
    const result: SeniorityComparison = compareSeniority(
      "Solutions Engineer",
      "Senior Solutions Engineer",
    );
    expect(result).toBe("more-senior");
  });

  it('returns "same-or-lower" when source role is less senior', () => {
    const result: SeniorityComparison = compareSeniority(
      "Senior Engineer",
      "Engineer",
    );
    expect(result).toBe("same-or-lower");
  });

  it('returns "same-or-lower" when roles are same level', () => {
    const result: SeniorityComparison = compareSeniority(
      "Senior Engineer",
      "Senior Designer",
    );
    expect(result).toBe("same-or-lower");
  });

  it('returns "same-or-lower" for empty sourceRole (graceful fallback)', () => {
    expect(compareSeniority("Engineer", "")).toBe("same-or-lower");
  });

  it('returns "same-or-lower" for undefined-ish sourceRole', () => {
    expect(compareSeniority("Engineer", undefined as unknown as string)).toBe(
      "same-or-lower",
    );
    expect(compareSeniority("Engineer", null as unknown as string)).toBe(
      "same-or-lower",
    );
  });
});
