/**
 * ScrapIn Data Provider
 *
 * Implements DataProvider interface using ScrapIn's LinkedIn enrichment API.
 * Workflow: Person Search (find people at company) -> Person Profile (get career history)
 * -> Extract post-departure positions -> Aggregate into CareerMigration[]
 *
 * VALIDATION STATUS: Not yet validated. SCRAPIN_API_KEY must be set and
 * scripts/validate-scrapin.ts must be run to confirm ScrapIn can answer
 * "where did people go after leaving company X?"
 *
 * If ScrapIn cannot answer the core question, this provider will throw
 * and the app falls back to MockProvider via the provider factory.
 */

import type { CareerMigration, DataProvider, MigrationSearchParams } from "../types";

const BASE_URL = "https://api.scrapin.io/enrichment";
const MAX_PROFILES = 20;
const PROFILE_CONCURRENCY = 5; // Parallel profile fetches to avoid rate limiting

interface ScrapInPosition {
  title?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
}

interface ScrapInPerson {
  firstName?: string;
  lastName?: string;
  headline?: string;
  linkedInUrl?: string;
  positions?: ScrapInPosition[];
}

interface ScrapInSearchResponse {
  success?: boolean;
  profiles?: Array<{ person?: ScrapInPerson }>;
  results?: Array<{ person?: ScrapInPerson }>;
  person?: ScrapInPerson;
  [key: string]: unknown;
}

function getApiKey(): string {
  const key = process.env.SCRAPIN_API_KEY;
  if (!key) {
    throw new Error(
      "SCRAPIN_API_KEY is not set. Sign up at https://www.scrapin.io/pricing and add the key to .env.local",
    );
  }
  return key;
}

async function fetchScrapIn(
  endpoint: string,
  params: Record<string, string>,
): Promise<unknown> {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`ScrapIn API error: HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Process profiles in batches to respect rate limits.
 */
async function fetchProfilesBatched(
  profileUrls: string[],
): Promise<ScrapInPerson[]> {
  const results: ScrapInPerson[] = [];
  const limited = profileUrls.slice(0, MAX_PROFILES);

  for (let i = 0; i < limited.length; i += PROFILE_CONCURRENCY) {
    const batch = limited.slice(i, i + PROFILE_CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map(async (linkedInUrl) => {
        const data = (await fetchScrapIn("profile", {
          linkedInUrl,
        })) as { person?: ScrapInPerson };
        return data.person;
      }),
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}

/**
 * Extract where a person went after leaving the target company.
 * Returns the first position held after the target company role ended.
 */
function extractPostDeparturePosition(
  person: ScrapInPerson,
  targetCompany: string,
): { destinationCompany: string; destinationRole: string } | null {
  const positions = person.positions ?? [];
  if (positions.length === 0) return null;

  const targetLower = targetCompany.toLowerCase();
  let foundTarget = false;

  // Positions are typically ordered most-recent-first, so we need to
  // find the target company position and then look at the next one (earlier index = more recent)
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    const isTarget = pos.companyName?.toLowerCase().includes(targetLower) ?? false;

    if (isTarget) {
      foundTarget = true;
      // Only count as "left" if the position has an end date
      if (!pos.endDate) continue;
    }

    if (foundTarget && !isTarget && pos.companyName && pos.title) {
      return {
        destinationCompany: pos.companyName,
        destinationRole: pos.title,
      };
    }
  }

  return null;
}

/**
 * Aggregate individual career transitions into CareerMigration counts.
 */
function aggregateTransitions(
  transitions: Array<{ destinationCompany: string; destinationRole: string }>,
  sourceCompany: string,
  sourceRole: string,
): CareerMigration[] {
  const counts = new Map<string, CareerMigration>();

  for (const t of transitions) {
    const key = `${t.destinationCompany.toLowerCase()}:${t.destinationRole.toLowerCase()}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, {
        sourceCompany,
        sourceRole,
        destinationCompany: t.destinationCompany,
        destinationRole: t.destinationRole,
        count: 1,
      });
    }
  }

  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export class ScrapInProvider implements DataProvider {
  name = "scrapin";

  async search(params: MigrationSearchParams): Promise<CareerMigration[]> {
    // Step 1: Search for people at the company with the role keyword
    const searchData = (await fetchScrapIn("company-search", {
      companyName: params.company,
      keyword: params.role,
    })) as ScrapInSearchResponse;

    // Extract profiles from response (API shape may vary)
    const rawProfiles =
      searchData.profiles ?? searchData.results ?? (searchData.person ? [searchData] : []);

    if (!Array.isArray(rawProfiles) || rawProfiles.length === 0) {
      return [];
    }

    // Step 2: Get LinkedIn URLs for profile enrichment
    const profileUrls: string[] = [];
    for (const profile of rawProfiles) {
      const person = profile?.person ?? (profile as unknown as ScrapInPerson);
      if (person?.linkedInUrl) {
        profileUrls.push(person.linkedInUrl);
      }
    }

    // Step 3: Fetch full career history for each profile (batched + parallel)
    const enrichedProfiles =
      profileUrls.length > 0
        ? await fetchProfilesBatched(profileUrls)
        : rawProfiles
            .map((p) => p?.person ?? (p as unknown as ScrapInPerson))
            .filter((p): p is ScrapInPerson => p != null);

    // Step 4: Extract post-departure positions
    const transitions: Array<{
      destinationCompany: string;
      destinationRole: string;
    }> = [];

    for (const person of enrichedProfiles) {
      const destination = extractPostDeparturePosition(person, params.company);
      if (destination) {
        transitions.push(destination);
      }
    }

    // Step 5: Aggregate into CareerMigration[]
    return aggregateTransitions(transitions, params.company, params.role);
  }

  async healthCheck(): Promise<boolean> {
    try {
      getApiKey(); // Throws if not set
      // Light API call to verify connectivity
      const data = (await fetchScrapIn("profile", {
        linkedInUrl: "https://www.linkedin.com/in/test",
      })) as { success?: boolean };
      return data.success !== false;
    } catch {
      return false;
    }
  }
}
