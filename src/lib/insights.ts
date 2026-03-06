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

// --- Role Classification ---

const LEADERSHIP_PATTERN =
  /\b(vp|vice president|director|head of|chief|president|ceo|cto|cfo|coo|cmo|cio|cpo|svp|evp)\b/i;

const TECHNICAL_PATTERN =
  /\b(engineer|developer|architect|sre|devops|data scientist|programmer|swe|software|infrastructure|platform|systems|security|ml|machine learning|ai)\b/i;

const BUSINESS_PATTERN =
  /\b(pm|product manager|sales|account|success|marketing|recruiter|operations|analyst|consultant|manager|coordinator|strategist|executive|representative)\b/i;

/**
 * Classify a destination role into one of four categories.
 * Priority: Same role > Leadership > Technical > Business (default).
 */
export function classifyRole(
  destinationRole: string,
  searchedRole: string,
): RoleCategory {
  // Check "Same role" first via normalized comparison
  const normalizedDest = normalizeRoleTitle(destinationRole).toLowerCase();
  const normalizedSearched = normalizeRoleTitle(searchedRole).toLowerCase();

  if (normalizedDest === normalizedSearched) {
    return "Same role";
  }

  if (LEADERSHIP_PATTERN.test(destinationRole)) {
    return "Leadership";
  }

  if (TECHNICAL_PATTERN.test(destinationRole)) {
    return "Technical";
  }

  // Business is the catch-all; explicit patterns checked first for clarity
  return "Business";
}

/**
 * Group migrations into role category buckets with percentages and top role names.
 * Returns only non-empty buckets, sorted by percentage descending.
 */
export function computeRoleBuckets(
  migrations: MigrationRecord[],
  searchedRole: string,
): RoleBucket[] {
  if (migrations.length === 0) return [];

  let totalCount = 0;
  const bucketCounts = new Map<RoleCategory, number>();
  const bucketRoles = new Map<RoleCategory, Map<string, number>>();

  for (const m of migrations) {
    const category = classifyRole(m.destinationRole, searchedRole);
    totalCount += m.count;

    bucketCounts.set(category, (bucketCounts.get(category) ?? 0) + m.count);

    if (!bucketRoles.has(category)) {
      bucketRoles.set(category, new Map());
    }
    const roleMap = bucketRoles.get(category)!;
    roleMap.set(m.destinationRole, (roleMap.get(m.destinationRole) ?? 0) + m.count);
  }

  if (totalCount === 0) return [];

  const buckets: RoleBucket[] = [];

  for (const [category, count] of bucketCounts) {
    const percentage = Math.round((count / totalCount) * 100);
    if (percentage === 0) continue;

    // Get top 3 role names by count within this bucket
    const roleMap = bucketRoles.get(category)!;
    const topRoles = [...roleMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role]) => role);

    buckets.push({ category, percentage, topRoles });
  }

  // Sort by percentage descending
  buckets.sort((a, b) => b.percentage - a.percentage);

  return buckets;
}

// --- Functions ---

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
