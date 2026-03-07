import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { leavers, leaverPositions } from "../db/schema";

describe("leavers table", () => {
  const config = getTableConfig(leavers);

  it("has the correct table name", () => {
    expect(config.name).toBe("leavers");
  });

  it("has all required columns", () => {
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("migration_id");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("linkedin_url");
    expect(columnNames).toContain("current_title");
    expect(columnNames).toContain("current_company");
    expect(columnNames).toContain("transition_date");
    expect(columnNames).toContain("created_at");
  });

  it("has id as primary key", () => {
    const idCol = config.columns.find((c) => c.name === "id");
    expect(idCol?.primary).toBe(true);
  });

  it("has migrationId referencing migrations.id", () => {
    const fks = config.foreignKeys;
    const migrationFk = fks.find((fk) => {
      const cols = fk.reference().columns.map((c) => c.name);
      return cols.includes("migration_id");
    });
    expect(migrationFk).toBeDefined();
    // Verify it references migrations table
    const foreignCols = migrationFk!.reference().foreignColumns;
    expect(foreignCols[0].name).toBe("id");
  });
});

describe("leaverPositions table", () => {
  const config = getTableConfig(leaverPositions);

  it("has the correct table name", () => {
    expect(config.name).toBe("leaver_positions");
  });

  it("has all required columns", () => {
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("leaver_id");
    expect(columnNames).toContain("company");
    expect(columnNames).toContain("title");
    expect(columnNames).toContain("start_date");
    expect(columnNames).toContain("end_date");
    expect(columnNames).toContain("sort_order");
  });

  it("has id as primary key", () => {
    const idCol = config.columns.find((c) => c.name === "id");
    expect(idCol?.primary).toBe(true);
  });

  it("has leaverId referencing leavers.id", () => {
    const fks = config.foreignKeys;
    const leaverFk = fks.find((fk) => {
      const cols = fk.reference().columns.map((c) => c.name);
      return cols.includes("leaver_id");
    });
    expect(leaverFk).toBeDefined();
    const foreignCols = leaverFk!.reference().foreignColumns;
    expect(foreignCols[0].name).toBe("id");
  });

  it("has index on leaverId", () => {
    const indexes = config.indexes;
    const leaverIdIdx = indexes.find((idx) => idx.config.name === "leaver_positions_leaverId_idx");
    expect(leaverIdIdx).toBeDefined();
  });
});
