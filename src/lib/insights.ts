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

// --- Pattern Summary ---

interface PatternCandidate {
  score: number;
  sentence: string;
}

/**
 * Generate a 2-3 sentence natural-language summary of migration patterns.
 * Sentences are ordered by "notability" score (most interesting first).
 */
export function generatePatternSummary(
  topDestinations: TopDestination[],
  roleBuckets: RoleBucket[],
  migrations: MigrationRecord[],
  searchedRole: string,
): string {
  if (migrations.length === 0) return "";

  const patterns: PatternCandidate[] = [];

  // 1. Concentration pattern
  if (topDestinations.length > 0 && topDestinations[0].percentage >= CONCENTRATION_THRESHOLD) {
    const top = topDestinations[0];
    patterns.push({
      score: top.percentage,
      sentence: `${top.percentage}% of leavers went to ${top.company}, making it the dominant destination.`,
    });
  }

  // 2. Role change pattern (Same role bucket)
  const sameRoleBucket = roleBuckets.find((b) => b.category === "Same role");
  if (sameRoleBucket) {
    if (sameRoleBucket.percentage < 20) {
      patterns.push({
        score: 100 - sameRoleBucket.percentage, // Very low is notable
        sentence: `Only ${sameRoleBucket.percentage}% kept a similar role, suggesting most leavers changed career direction.`,
      });
    } else {
      patterns.push({
        score: sameRoleBucket.percentage,
        sentence: `${sameRoleBucket.percentage}% stayed in a similar role, indicating strong role retention.`,
      });
    }
  }

  // 3. Top transition pattern (always included)
  const roleCounts = new Map<string, number>();
  let totalCount = 0;
  for (const m of migrations) {
    roleCounts.set(m.destinationRole, (roleCounts.get(m.destinationRole) ?? 0) + m.count);
    totalCount += m.count;
  }
  if (roleCounts.size > 0 && totalCount > 0) {
    const topRole = [...roleCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topRolePct = Math.round((topRole[1] / totalCount) * 100);
    patterns.push({
      score: topRole[1],
      sentence: `The most common move is to ${topRole[0]} (${topRolePct}%).`,
    });
  }

  // 4. Seniority trend pattern
  const seniorityDeltas: number[] = [];
  for (const m of migrations) {
    if (m.sourceRole) {
      const srcLevel = parseSeniorityLevel(m.sourceRole);
      const destLevel = parseSeniorityLevel(m.destinationRole);
      for (let i = 0; i < m.count; i++) {
        seniorityDeltas.push(destLevel - srcLevel);
      }
    }
  }
  if (seniorityDeltas.length > 0) {
    const avgDelta = seniorityDeltas.reduce((a, b) => a + b, 0) / seniorityDeltas.length;
    let trend: string;
    if (avgDelta > 0.5) {
      trend = "more senior";
    } else if (avgDelta < -0.5) {
      trend = "less senior";
    } else {
      trend = "similar-level";
    }
    patterns.push({
      score: Math.abs(avgDelta) * 10,
      sentence: `Most transitions were to ${trend} positions.`,
    });
  }

  // Sort by score descending, take top 2-3
  patterns.sort((a, b) => b.score - a.score);
  const selected = patterns.slice(0, 3);

  return selected.map((p) => p.sentence).join(" ");
}

// --- Orchestrator ---

/**
 * Compute all insights from migration records.
 * Returns empty results for empty migrations.
 */
export function computeInsights(
  migrations: MigrationRecord[],
  searchedRole: string,
): InsightsData {
  if (migrations.length === 0) {
    return {
      topDestinations: [],
      roleBuckets: [],
      patternSummary: "",
      totalMigrations: 0,
    };
  }

  const totalMigrations = migrations.reduce((sum, m) => sum + m.count, 0);
  const topDestinations = computeTopDestinations(migrations);
  const roleBuckets = computeRoleBuckets(migrations, searchedRole);
  const patternSummary = generatePatternSummary(
    topDestinations,
    roleBuckets,
    migrations,
    searchedRole,
  );

  return {
    topDestinations,
    roleBuckets,
    patternSummary,
    totalMigrations,
  };
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
