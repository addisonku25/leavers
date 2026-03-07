import type {
  CareerMigration,
  DataProvider,
  DetailedLeaver,
  DetailedSearchResult,
  LeaverPosition,
  MigrationSearchParams,
} from "../types";

// Deterministic destination data based on input hash
const DESTINATION_COMPANIES = [
  "Google",
  "Meta",
  "Apple",
  "Amazon",
  "Microsoft",
  "Stripe",
  "Salesforce",
  "Netflix",
  "Uber",
  "Airbnb",
  "Coinbase",
  "Datadog",
  "Snowflake",
  "Databricks",
  "HubSpot",
  "McKinsey & Company",
  "Goldman Sachs",
  "JPMorgan Chase",
  "Deloitte",
  "Accenture",
];

const DESTINATION_ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Software Engineer",
  "Engineering Manager",
  "Product Manager",
  "Solutions Engineer",
  "Data Scientist",
  "Technical Program Manager",
  "Account Executive",
  "Management Consultant",
  "Director of Engineering",
  "VP of Engineering",
  "Data Engineer",
  "DevOps Engineer",
  "Solutions Architect",
];

/**
 * Simple deterministic hash for consistent mock data generation.
 * Produces a number from a string input.
 */
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export class MockProvider implements DataProvider {
  name = "mock";

  async search(params: MigrationSearchParams): Promise<CareerMigration[]> {
    const seed = simpleHash(`${params.company}:${params.role}`);
    const companyCount = 6 + (seed % 8); // 6-13 destination companies

    const migrations: CareerMigration[] = [];

    for (let i = 0; i < companyCount; i++) {
      const companyIndex = (seed + i * 7) % DESTINATION_COMPANIES.length;

      // Skip if destination is same as source
      let destCompany = DESTINATION_COMPANIES[companyIndex];
      if (destCompany.toLowerCase() === params.company.toLowerCase()) {
        destCompany = DESTINATION_COMPANIES[(companyIndex + 1) % DESTINATION_COMPANIES.length];
      }

      // Generate 1-5 roles per company
      const rolesForCompany = 1 + ((seed + i * 11) % 5);
      for (let j = 0; j < rolesForCompany; j++) {
        const roleIndex = (seed + i * 13 + j * 3) % DESTINATION_ROLES.length;
        const migrationCount = 1 + ((seed + i * 3 + j * 7) % 20);

        migrations.push({
          sourceCompany: params.company,
          sourceRole: DESTINATION_ROLES[(seed + i * 5 + j * 2) % DESTINATION_ROLES.length],
          destinationCompany: destCompany,
          destinationRole: DESTINATION_ROLES[roleIndex],
          count: migrationCount,
        });
      }
    }

    return migrations;
  }

  async searchDetailed(params: MigrationSearchParams): Promise<DetailedSearchResult> {
    const migrations = await this.search(params);
    const seed = simpleHash(`${params.company}:${params.role}`);
    const leavers: DetailedLeaver[] = [];

    for (let migIdx = 0; migIdx < migrations.length; migIdx++) {
      const migration = migrations[migIdx];
      const migLeavers = generateMockLeavers(migration, migIdx, seed);
      leavers.push(...migLeavers);
    }

    return { migrations, leavers };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

/**
 * Generate deterministic mock leavers for a single migration.
 * Returns 5-10 leavers, each with 2-4 career positions.
 */
function generateMockLeavers(
  migration: CareerMigration,
  migrationIndex: number,
  seed: number,
): DetailedLeaver[] {
  const leaverCount = 5 + ((seed + migrationIndex * 17) % 6);
  const leavers: DetailedLeaver[] = [];
  const baseYear = 2018;

  for (let i = 0; i < leaverCount; i++) {
    const leaverSeed = seed + migrationIndex * 1000 + i * 31;
    const positionCount = 2 + (leaverSeed % 3);
    const userId = migrationIndex * 100 + i + 1;

    const positions: LeaverPosition[] = [];
    for (let j = 0; j < positionCount; j++) {
      if (j === 0) {
        // First position = current role at destination company
        positions.push({
          company: migration.destinationCompany,
          title: migration.destinationRole,
          startDate: `${baseYear + j * 2}-01`,
          endDate: undefined, // current position
        });
      } else {
        const companyIdx = (leaverSeed + j * 7) % DESTINATION_COMPANIES.length;
        const roleIdx = (leaverSeed + j * 11) % DESTINATION_ROLES.length;
        positions.push({
          company: DESTINATION_COMPANIES[companyIdx],
          title: DESTINATION_ROLES[roleIdx],
          startDate: `${baseYear + j * 2}-01`,
          endDate: `${baseYear + j * 2 + 1}-12`,
        });
      }
    }

    leavers.push({
      name: `Test User ${userId}`,
      linkedinUrl: `https://linkedin.com/in/test-user-${userId}`,
      currentTitle: migration.destinationRole,
      currentCompany: migration.destinationCompany,
      transitionDate: `${baseYear}-06`,
      positions,
      destinationCompany: migration.destinationCompany,
      destinationRole: migration.destinationRole,
    });
  }

  return leavers;
}
