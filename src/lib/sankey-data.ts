import { compareSeniority, normalizeRoleTitle, type SeniorityComparison } from "./seniority";

/** Migration record shape expected by data transformation functions. */
export interface MigrationRecord {
  destinationCompany: string;
  destinationRole: string;
  sourceRole?: string | null;
  count: number;
}

/** Company card data for the results page. */
export interface CompanyCardData {
  company: string;
  totalCount: number;
  roles: {
    role: string;
    count: number;
    seniority: SeniorityComparison;
  }[];
}

/** Sankey diagram node. */
export interface SankeyNode {
  name: string;
  category: "source" | "company" | "destination";
}

/** Sankey diagram link (indices into nodes array). */
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

/** Complete Sankey diagram data structure. */
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

const MAX_COMPANIES = 8;
const MAX_ROLES_PER_COMPANY = 5;

/**
 * Group migration records by destination company for card display.
 * Sorted by total count descending; roles within each company sorted by count descending.
 * Includes seniority comparison for each role against the searched role.
 */
export function groupMigrationsForCards(
  migrations: MigrationRecord[],
  searchedRole: string,
): CompanyCardData[] {
  if (migrations.length === 0) return [];

  const companyMap = new Map<
    string,
    { role: string; count: number; sourceRole: string }[]
  >();

  for (const m of migrations) {
    const existing = companyMap.get(m.destinationCompany) ?? [];
    existing.push({
      role: m.destinationRole,
      count: m.count,
      sourceRole: m.sourceRole ?? "",
    });
    companyMap.set(m.destinationCompany, existing);
  }

  const cards: CompanyCardData[] = [];

  for (const [company, roles] of companyMap) {
    const totalCount = roles.reduce((sum, r) => sum + r.count, 0);
    const sortedRoles = roles
      .sort((a, b) => b.count - a.count)
      .map((r) => ({
        role: r.role,
        count: r.count,
        seniority: compareSeniority(searchedRole, r.sourceRole),
      }));

    cards.push({ company, totalCount, roles: sortedRoles });
  }

  cards.sort((a, b) => b.totalCount - a.totalCount);

  return cards;
}

/**
 * Build a 3-column Sankey diagram data structure from migration records.
 * Columns: source role (left) -> destination companies (middle) -> destination roles (right).
 * Limits to top 8 companies and top 5 roles per company; remainders grouped into "Other".
 */
export function buildSankeyData(
  migrations: MigrationRecord[],
  searchRole: string,
): SankeyData {
  if (migrations.length === 0) return { nodes: [], links: [] };

  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Source node (index 0)
  nodes.push({ name: searchRole, category: "source" });

  // Aggregate by company
  const companyTotals = new Map<string, number>();
  const companyRoles = new Map<
    string,
    { role: string; count: number }[]
  >();

  for (const m of migrations) {
    companyTotals.set(
      m.destinationCompany,
      (companyTotals.get(m.destinationCompany) ?? 0) + m.count,
    );

    const roles = companyRoles.get(m.destinationCompany) ?? [];
    roles.push({ role: m.destinationRole, count: m.count });
    companyRoles.set(m.destinationCompany, roles);
  }

  // Sort companies by total count descending
  const sortedCompanies = [...companyTotals.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  const topCompanies = sortedCompanies.slice(0, MAX_COMPANIES);
  const otherCompanies = sortedCompanies.slice(MAX_COMPANIES);

  // Shared destination role node registry (normalized key -> node index)
  const destNodeIndex = new Map<string, number>();

  // Add company nodes and source->company links
  for (const [company, total] of topCompanies) {
    const companyIdx = nodes.length;
    nodes.push({ name: company, category: "company" });
    links.push({ source: 0, target: companyIdx, value: total });

    // Add destination role nodes for this company
    addRoleNodes(companyRoles.get(company) ?? [], companyIdx, nodes, links, destNodeIndex);
  }

  // Group remaining companies into "Other"
  if (otherCompanies.length > 0) {
    const otherTotal = otherCompanies.reduce((sum, [, count]) => sum + count, 0);
    const otherIdx = nodes.length;
    nodes.push({
      name: `Other (${otherCompanies.length} companies)`,
      category: "company",
    });
    links.push({ source: 0, target: otherIdx, value: otherTotal });

    // Merge all roles from "other" companies
    const mergedRoles: { role: string; count: number }[] = [];
    for (const [company] of otherCompanies) {
      mergedRoles.push(...(companyRoles.get(company) ?? []));
    }
    addRoleNodes(mergedRoles, otherIdx, nodes, links, destNodeIndex);
  }

  return { nodes, links };
}

/** Merge roles with the same normalized title, using the highest-count variant as display name. */
function mergeRolesByNormalizedTitle(
  roles: { role: string; count: number }[],
): { role: string; count: number }[] {
  const groups = new Map<string, { displayName: string; maxCount: number; totalCount: number }>();

  for (const { role, count } of roles) {
    const key = normalizeRoleTitle(role).toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.totalCount += count;
      if (count > existing.maxCount) {
        existing.displayName = role;
        existing.maxCount = count;
      }
    } else {
      groups.set(key, { displayName: role, maxCount: count, totalCount: count });
    }
  }

  return [...groups.values()]
    .map((g) => ({ role: g.displayName, count: g.totalCount }))
    .sort((a, b) => b.count - a.count);
}

/** Add destination role nodes for a company, reusing shared destination nodes across companies. */
function addRoleNodes(
  roles: { role: string; count: number }[],
  companyIdx: number,
  nodes: SankeyNode[],
  links: SankeyLink[],
  destNodeIndex: Map<string, number>,
): void {
  const merged = mergeRolesByNormalizedTitle(roles);
  const topRoles = merged.slice(0, MAX_ROLES_PER_COMPANY);
  const otherRoles = merged.slice(MAX_ROLES_PER_COMPANY);

  for (const { role, count } of topRoles) {
    const key = normalizeRoleTitle(role).toLowerCase();
    let roleIdx = destNodeIndex.get(key);
    if (roleIdx === undefined) {
      roleIdx = nodes.length;
      nodes.push({ name: role, category: "destination" });
      destNodeIndex.set(key, roleIdx);
    }
    links.push({ source: companyIdx, target: roleIdx, value: count });
  }

  if (otherRoles.length > 0) {
    const otherTotal = otherRoles.reduce((sum, r) => sum + r.count, 0);
    let otherIdx = destNodeIndex.get("__other_roles__");
    if (otherIdx === undefined) {
      otherIdx = nodes.length;
      nodes.push({ name: "Other roles", category: "destination" });
      destNodeIndex.set("__other_roles__", otherIdx);
    }
    links.push({ source: companyIdx, target: otherIdx, value: otherTotal });
  }
}
