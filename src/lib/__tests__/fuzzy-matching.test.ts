import { describe, expect, it } from "vitest";
import { matchRole } from "../matching/fuzzy";

describe("matchRole", () => {
  it('maps "Sr. SE" to include "Solutions Engineer"', () => {
    const results = matchRole("Sr. SE");
    expect(results).toContain("Solutions Engineer");
  });

  it('maps "SWE" to include "Software Engineer"', () => {
    const results = matchRole("SWE");
    expect(results).toContain("Software Engineer");
  });

  it('maps "PM" to include "Product Manager"', () => {
    const results = matchRole("PM");
    expect(results).toContain("Product Manager");
  });

  it("returns empty array for nonexistent role", () => {
    const results = matchRole("xyznonexistent");
    expect(results).toEqual([]);
  });

  it('maps "Solution Engineer" (synonym) to include "Solutions Engineer"', () => {
    const results = matchRole("Solution Engineer");
    expect(results).toContain("Solutions Engineer");
  });

  it("handles exact title match", () => {
    const results = matchRole("Software Engineer");
    expect(results).toContain("Software Engineer");
  });

  it("handles case-insensitive matching", () => {
    const results = matchRole("software engineer");
    expect(results).toContain("Software Engineer");
  });
});
