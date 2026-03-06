import type { CareerMigration, DataProvider, MigrationSearchParams } from "../types";

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
    const count = 5 + (seed % 11); // 5-15 results

    const migrations: CareerMigration[] = [];

    for (let i = 0; i < count; i++) {
      const companyIndex = (seed + i * 7) % DESTINATION_COMPANIES.length;
      const roleIndex = (seed + i * 13) % DESTINATION_ROLES.length;
      const migrationCount = 1 + ((seed + i * 3) % 20);

      // Skip if destination is same as source
      let destCompany = DESTINATION_COMPANIES[companyIndex];
      if (destCompany.toLowerCase() === params.company.toLowerCase()) {
        destCompany = DESTINATION_COMPANIES[(companyIndex + 1) % DESTINATION_COMPANIES.length];
      }

      migrations.push({
        sourceCompany: params.company,
        sourceRole: params.role,
        destinationCompany: destCompany,
        destinationRole: DESTINATION_ROLES[roleIndex],
        count: migrationCount,
      });
    }

    return migrations;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
