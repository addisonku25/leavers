import type { MigrationRecord } from "./sankey-data";
import { normalizeRoleTitle, parseSeniorityLevel } from "./seniority";

// --- Types ---

export interface TopDestination {
  company: string;
  percentage: number;
}

export type RoleCategory = "Leadership" | "Business" | "Technical" | "Same role";

export interface RoleBucket {
  category: RoleCategory;
  percentage: number;
  topRoles: string[];
}

export interface InsightsData {
  topDestinations: TopDestination[];
  roleBuckets: RoleBucket[];
  patternSummary: string;
  totalMigrations: number;
}

// --- Constants ---

export const CONCENTRATION_THRESHOLD = 25;
export const MIN_MEANINGFUL_MIGRATIONS = 3;
export const MAX_TOP_DESTINATIONS = 5;

// --- Functions (stubs) ---

export function computeTopDestinations(
  migrations: MigrationRecord[],
  limit: number = MAX_TOP_DESTINATIONS,
): TopDestination[] {
  if (migrations.length === 0) return [];

  // Aggregate counts by destination company
  const companyTotals = new Map<string, number>();
  let totalCount = 0;

  for (const m of migrations) {
    companyTotals.set(
      m.destinationCompany,
      (companyTotals.get(m.destinationCompany) ?? 0) + m.count,
    );
    totalCount += m.count;
  }

  if (totalCount === 0) return [];

  // Convert to array, compute percentages, sort, and limit
  return [...companyTotals.entries()]
    .map(([company, count]) => ({
      company,
      percentage: Math.round((count / totalCount) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);
}
