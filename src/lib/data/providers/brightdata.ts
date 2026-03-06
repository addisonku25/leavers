/**
 * BrightData Data Provider
 *
 * Implements DataProvider interface using BrightData's LinkedIn People Profile dataset.
 * Dataset: gd_l1viktl72bvl7bjuj0 (LinkedIn People Profile)
 *
 * Workflow:
 * 1. Accept a list of LinkedIn profile URLs
 * 2. Scrape profiles via BrightData's synchronous/async dataset API
 * 3. Extract experience arrays from each profile
 * 4. Find post-departure positions (where people went after leaving the target company)
 * 5. Aggregate into CareerMigration[]
 *
 * VALIDATION STATUS: PASSED (2026-03-06)
 * - Returns full experience array with title, company, company_id, start_date, end_date
 * - Cost: ~$0.001/record vs ScrapIn's $0.01/record
 * - Supports synchronous (200) and async (202) response modes
 *
 * LIMITATION: BrightData's People Profile dataset scrapes individual profiles by URL.
 * It does NOT search for people by company+role. To find profiles, we need either:
 * - A separate discovery step (BrightData's Company Employees dataset, or another source)
 * - Pre-collected LinkedIn URLs
 * For now, this provider accepts profile URLs and extracts career migrations from them.
 */

import type {
  CareerMigration,
  DataProvider,
  MigrationSearchParams,
} from "../types";

const DATASET_ID = "gd_l1viktl72bvl7bjuj0";
const BASE_URL = "https://api.brightdata.com/datasets/v3";
const MAX_PROFILES = 20;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 30;

interface BrightDataExperience {
  title?: string;
  company?: string;
  company_id?: string;
  start_date?: string;
  end_date?: string | null;
  location?: string;
  description_html?: string | null;
  url?: string;
  company_logo_url?: string;
}

interface BrightDataProfile {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  city?: string;
  country_code?: string;
  current_company?: {
    name?: string;
    company_id?: string;
    title?: string;
    location?: string;
  };
  experience?: BrightDataExperience[] | null;
  url?: string;
  input_url?: string;
  linkedin_id?: string;
  [key: string]: unknown;
}

function getApiKey(): string {
  const key = process.env.BRIGHTDATA_API_KEY;
  if (!key) {
    throw new Error(
      "BRIGHTDATA_API_KEY is not set. Sign up at https://brightdata.com and add the key to .env.local",
    );
  }
  return key;
}

/**
 * Scrape LinkedIn profiles via BrightData's dataset API.
 * Handles both synchronous (200) and async (202 + polling) responses.
 */
async function scrapeProfiles(
  profileUrls: string[],
): Promise<BrightDataProfile[]> {
  const apiKey = getApiKey();
  const limited = profileUrls.slice(0, MAX_PROFILES);

  const url = `${BASE_URL}/scrape?dataset_id=${DATASET_ID}&format=json&include_errors=true`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(limited.map((profileUrl) => ({ url: profileUrl }))),
  });

  if (response.status === 200) {
    // Synchronous result
    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  }

  if (response.status === 202) {
    // Async -- need to poll for results
    const { snapshot_id } = (await response.json()) as {
      snapshot_id: string;
    };
    return pollForResults(snapshot_id, apiKey);
  }

  const body = await response.text();
  throw new Error(
    `BrightData API error: HTTP ${response.status} - ${body}`,
  );
}

/**
 * Poll BrightData for async scrape results.
 */
async function pollForResults(
  snapshotId: string,
  apiKey: string,
): Promise<BrightDataProfile[]> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const progressRes = await fetch(
      `${BASE_URL}/progress/${snapshotId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (progressRes.status === 200) {
      const progress = (await progressRes.json()) as { status: string };

      if (progress.status === "ready") {
        const dataRes = await fetch(
          `${BASE_URL}/snapshot/${snapshotId}?format=json`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        const data = await dataRes.json();
        return Array.isArray(data) ? data : [data];
      }
    }
  }

  throw new Error(
    `BrightData scrape timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`,
  );
}

/**
 * Extract where a person went after leaving the target company.
 *
 * BrightData experience arrays are ordered most-recent-first.
 * We scan oldest-to-newest (reverse) to find the target company,
 * then look for the next role at a different company.
 */
function extractPostDeparturePosition(
  profile: BrightDataProfile,
  targetCompany: string,
): { destinationCompany: string; destinationRole: string } | null {
  const experience = profile.experience;
  if (!experience || experience.length === 0) return null;

  const targetLower = targetCompany.toLowerCase();
  let foundTarget = false;

  // Walk oldest-to-newest (reverse of array order)
  for (let i = experience.length - 1; i >= 0; i--) {
    const exp = experience[i];
    const companyName = exp.company ?? "";
    const isTarget = companyName.toLowerCase().includes(targetLower);

    if (isTarget) {
      foundTarget = true;
      // Only count as "left" if the position has an end date (not "Present")
      if (!exp.end_date || exp.end_date === "Present") continue;
    }

    if (foundTarget && !isTarget && companyName && exp.title) {
      return {
        destinationCompany: companyName,
        destinationRole: exp.title,
      };
    }
  }

  return null;
}

/**
 * Aggregate individual transitions into CareerMigration counts.
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

export class BrightDataProvider implements DataProvider {
  name = "brightdata";

  /**
   * Search for career migrations.
   *
   * NOTE: BrightData's People Profile dataset requires LinkedIn URLs as input.
   * This provider currently works best when profile URLs are already known.
   * For company+role discovery, a separate dataset or pre-collected URLs are needed.
   *
   * For now, this throws a descriptive error when called without URLs,
   * since the mock provider handles the company+role search case in dev.
   */
  async search(params: MigrationSearchParams): Promise<CareerMigration[]> {
    // BrightData People Profile requires specific LinkedIn URLs.
    // When profile URLs are provided (future: via a discovery step),
    // we scrape them and extract career migrations.
    //
    // For the MVP, if no profileUrls are available, we return empty results
    // with a log message rather than throwing, so the app degrades gracefully.
    const profileUrls = (params as MigrationSearchParams & { profileUrls?: string[] }).profileUrls;

    if (!profileUrls || profileUrls.length === 0) {
      console.warn(
        `[BrightData] No profile URLs provided for "${params.company} / ${params.role}". ` +
          "BrightData People Profile requires LinkedIn URLs. " +
          "Use the mock provider for company+role search, or provide profileUrls.",
      );
      return [];
    }

    // Scrape profiles
    const profiles = await scrapeProfiles(profileUrls);

    // Filter out profiles with no experience data
    const validProfiles = profiles.filter(
      (p) => p.experience && p.experience.length > 0,
    );

    if (validProfiles.length === 0) {
      return [];
    }

    // Extract post-departure positions
    const transitions: Array<{
      destinationCompany: string;
      destinationRole: string;
    }> = [];

    for (const profile of validProfiles) {
      const destination = extractPostDeparturePosition(
        profile,
        params.company,
      );
      if (destination) {
        transitions.push(destination);
      }
    }

    return aggregateTransitions(transitions, params.company, params.role);
  }

  async healthCheck(): Promise<boolean> {
    try {
      getApiKey(); // Throws if not set
      // Light check -- just verify API key format is present
      // We don't make an actual API call to avoid cost on health checks
      return true;
    } catch {
      return false;
    }
  }
}
