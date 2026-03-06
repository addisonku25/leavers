import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const searches = sqliteTable("searches", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  cacheKey: text("cache_key").notNull().unique(),
  provider: text("provider").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  status: text("status", { enum: ["pending", "complete", "error"] })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const migrations = sqliteTable("migrations", {
  id: text("id").primaryKey(),
  searchId: text("search_id")
    .notNull()
    .references(() => searches.id),
  destinationCompany: text("destination_company").notNull(),
  destinationRole: text("destination_role").notNull(),
  sourceRole: text("source_role"),
  count: integer("count").notNull().default(1),
});
