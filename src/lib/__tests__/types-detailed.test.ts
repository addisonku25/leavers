import { describe, expect, it } from "vitest";
import type {
  CareerMigration,
  DataProvider,
  DetailedLeaver,
  DetailedSearchResult,
  LeaverPosition,
  MigrationSearchParams,
} from "../data/types";

describe("LeaverPosition interface", () => {
  it("has required fields: company, title", () => {
    const pos: LeaverPosition = {
      company: "Google",
      title: "Software Engineer",
    };
    expect(pos.company).toBe("Google");
    expect(pos.title).toBe("Software Engineer");
  });

  it("has optional fields: startDate, endDate", () => {
    const pos: LeaverPosition = {
      company: "Google",
      title: "Software Engineer",
      startDate: "2024-03",
      endDate: "2025-01",
    };
    expect(pos.startDate).toBe("2024-03");
    expect(pos.endDate).toBe("2025-01");
  });

  it("allows undefined optional fields", () => {
    const pos: LeaverPosition = {
      company: "Google",
      title: "SWE",
    };
    expect(pos.startDate).toBeUndefined();
    expect(pos.endDate).toBeUndefined();
  });
});

describe("DetailedLeaver interface", () => {
  it("has required fields: name, destinationCompany, destinationRole, positions", () => {
    const leaver: DetailedLeaver = {
      name: "Jane Doe",
      destinationCompany: "Meta",
      destinationRole: "Product Manager",
      positions: [],
    };
    expect(leaver.name).toBe("Jane Doe");
    expect(leaver.destinationCompany).toBe("Meta");
    expect(leaver.destinationRole).toBe("Product Manager");
    expect(leaver.positions).toEqual([]);
  });

  it("has optional fields: linkedinUrl, currentTitle, currentCompany, transitionDate", () => {
    const leaver: DetailedLeaver = {
      name: "Jane Doe",
      destinationCompany: "Meta",
      destinationRole: "Product Manager",
      positions: [],
      linkedinUrl: "https://linkedin.com/in/janedoe",
      currentTitle: "Senior PM",
      currentCompany: "Meta",
      transitionDate: "2024-06-15",
    };
    expect(leaver.linkedinUrl).toBe("https://linkedin.com/in/janedoe");
    expect(leaver.currentTitle).toBe("Senior PM");
    expect(leaver.currentCompany).toBe("Meta");
    expect(leaver.transitionDate).toBe("2024-06-15");
  });
});

describe("DetailedSearchResult interface", () => {
  it("has migrations (CareerMigration[]) and leavers (DetailedLeaver[])", () => {
    const result: DetailedSearchResult = {
      migrations: [
        {
          sourceCompany: "Google",
          sourceRole: "SWE",
          destinationCompany: "Meta",
          destinationRole: "SWE",
          count: 5,
        },
      ],
      leavers: [
        {
          name: "Jane Doe",
          destinationCompany: "Meta",
          destinationRole: "SWE",
          positions: [{ company: "Google", title: "SWE" }],
        },
      ],
    };
    expect(result.migrations).toHaveLength(1);
    expect(result.leavers).toHaveLength(1);
  });
});

describe("DataProvider interface backward compatibility", () => {
  it("accepts a class with only search + healthCheck (no searchDetailed)", () => {
    class MinimalProvider implements DataProvider {
      name = "minimal";
      async search(_params: MigrationSearchParams): Promise<CareerMigration[]> {
        return [];
      }
      async healthCheck(): Promise<boolean> {
        return true;
      }
    }

    const provider: DataProvider = new MinimalProvider();
    expect(provider.name).toBe("minimal");
    expect(typeof provider.search).toBe("function");
    expect(typeof provider.healthCheck).toBe("function");
    expect(provider.searchDetailed).toBeUndefined();
  });

  it("accepts a class with searchDetailed", () => {
    class DetailedProvider implements DataProvider {
      name = "detailed";
      async search(_params: MigrationSearchParams): Promise<CareerMigration[]> {
        return [];
      }
      async searchDetailed(_params: MigrationSearchParams): Promise<DetailedSearchResult> {
        return { migrations: [], leavers: [] };
      }
      async healthCheck(): Promise<boolean> {
        return true;
      }
    }

    const provider: DataProvider = new DetailedProvider();
    expect(provider.searchDetailed).toBeDefined();
  });
});
