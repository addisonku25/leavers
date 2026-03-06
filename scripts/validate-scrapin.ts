/**
 * ScrapIn API Validation Script
 *
 * Purpose: Validate whether ScrapIn can answer "where did people go after leaving company X?"
 * This is the highest-risk question in the entire project. If ScrapIn can't answer it,
 * we fall back to mock data per the locked decision.
 *
 * Usage: npx tsx scripts/validate-scrapin.ts
 *
 * Prerequisites: SCRAPIN_API_KEY must be set in .env.local
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Load environment from .env.local
// ---------------------------------------------------------------------------
function loadEnv(): void {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist
  }
}

loadEnv();

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_KEY = process.env.SCRAPIN_API_KEY;
const BASE_URL = "https://api.scrapin.io/enrichment";

const TEST_COMPANY = "Google";
const TEST_ROLE = "Software Engineer";

// ---------------------------------------------------------------------------
// Types for ScrapIn API responses
// ---------------------------------------------------------------------------
interface ScrapInPosition {
  title?: string;
  companyName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface ScrapInProfile {
  person?: {
    firstName?: string;
    lastName?: string;
    headline?: string;
    positions?: ScrapInPosition[];
  };
  company?: {
    name?: string;
  };
  success?: boolean;
}

interface ScrapInSearchResult {
  success?: boolean;
  person?: ScrapInProfile["person"];
  profiles?: ScrapInProfile[];
  results?: ScrapInProfile[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// API Helpers
// ---------------------------------------------------------------------------
async function callScrapIn(
  endpoint: string,
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("apikey", API_KEY!);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const start = performance.now();
  const response = await fetch(url.toString());
  const latency = Math.round(performance.now() - start);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`  Latency: ${latency}ms`);
  return data;
}

// ---------------------------------------------------------------------------
// Validation Checks
// ---------------------------------------------------------------------------
interface ValidationResult {
  canFilterByCompany: boolean | null;
  includesFormerEmployees: boolean | null;
  hasCareerHistory: boolean | null;
  showsPostDepartureJobs: boolean | null;
  avgLatencyMs: number | null;
  resultCount: number | null;
  sampleData: string[];
  errors: string[];
}

async function runValidation(): Promise<ValidationResult> {
  const result: ValidationResult = {
    canFilterByCompany: null,
    includesFormerEmployees: null,
    hasCareerHistory: null,
    showsPostDepartureJobs: null,
    avgLatencyMs: null,
    resultCount: null,
    sampleData: [],
    errors: [],
  };

  // --- Step 1: Person Search by company + role keyword ---
  console.log(`\n[Step 1] Searching for "${TEST_ROLE}" at "${TEST_COMPANY}"...`);
  let searchData: ScrapInSearchResult;
  try {
    searchData = (await callScrapIn("company-search", {
      companyName: TEST_COMPANY,
      keyword: TEST_ROLE,
    })) as ScrapInSearchResult;

    console.log("  Raw response keys:", Object.keys(searchData));
    console.log(
      "  Response preview:",
      JSON.stringify(searchData, null, 2).slice(0, 500),
    );

    // Check if we can filter by company
    result.canFilterByCompany = searchData.success !== false;

    // Count results
    const profiles =
      searchData.profiles ?? searchData.results ?? (searchData.person ? [searchData] : []);
    result.resultCount = Array.isArray(profiles) ? profiles.length : 0;
    console.log(`  Results found: ${result.resultCount}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Person Search failed: ${msg}`);
    console.log(`  ERROR: ${msg}`);
    return result;
  }

  // --- Step 2: Check if results include former employees ---
  console.log("\n[Step 2] Checking for former employees in results...");
  const profiles =
    searchData.profiles ?? searchData.results ?? (searchData.person ? [searchData] : []);

  if (!Array.isArray(profiles) || profiles.length === 0) {
    result.errors.push("No profiles returned from search");
    console.log("  No profiles to analyze");
    return result;
  }

  // --- Step 3: Get career history for 2-3 results ---
  console.log("\n[Step 3] Fetching career history for sample profiles...");
  const samplesToCheck = Math.min(3, profiles.length);
  const latencies: number[] = [];
  let formerCount = 0;
  let postDepartureCount = 0;

  for (let i = 0; i < samplesToCheck; i++) {
    const profile = profiles[i];
    const person = profile?.person ?? profile;

    const name = `${person?.firstName ?? "Unknown"} ${person?.lastName ?? ""}`.trim();
    console.log(`\n  Profile ${i + 1}: ${name}`);

    // Check positions for career history
    const positions = person?.positions ?? [];
    console.log(`  Positions found: ${positions.length}`);

    if (positions.length > 0) {
      result.hasCareerHistory = true;

      // Find the Google position and check if there's a position AFTER it
      let foundTargetCompany = false;
      let foundPostDeparture = false;

      for (let j = 0; j < positions.length; j++) {
        const pos = positions[j];
        const isTarget =
          pos.companyName?.toLowerCase().includes(TEST_COMPANY.toLowerCase()) ?? false;

        if (isTarget) {
          foundTargetCompany = true;
          // Check if this person has ended their position (former employee)
          if (pos.endDate) {
            formerCount++;
            console.log(
              `  -> Former ${TEST_COMPANY} employee (left: ${pos.endDate})`,
            );
          }
        }

        // Check for positions AFTER the target company
        if (foundTargetCompany && !isTarget && pos.startDate) {
          foundPostDeparture = true;
          postDepartureCount++;
          result.sampleData.push(
            `${name}: ${TEST_COMPANY} -> ${pos.companyName ?? "Unknown"} (${pos.title ?? "Unknown role"})`,
          );
          console.log(
            `  -> Went to: ${pos.companyName} as ${pos.title}`,
          );
        }
      }

      if (!foundTargetCompany) {
        console.log(`  -> Not associated with ${TEST_COMPANY}`);
      }
      if (!foundPostDeparture && foundTargetCompany) {
        console.log(`  -> No post-${TEST_COMPANY} position found`);
      }
    } else {
      console.log("  No position history available");
    }
  }

  result.includesFormerEmployees = formerCount > 0;
  result.showsPostDepartureJobs = postDepartureCount > 0;

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("ScrapIn API Validation");
  console.log("=".repeat(60));
  console.log(`Company: ${TEST_COMPANY}`);
  console.log(`Role: ${TEST_ROLE}`);
  console.log(`API Key: ${API_KEY ? `${API_KEY.slice(0, 8)}...` : "NOT SET"}`);

  if (!API_KEY) {
    console.log("\n" + "=".repeat(60));
    console.log("RESULT: SKIPPED -- No SCRAPIN_API_KEY set");
    console.log("=".repeat(60));
    console.log("\nTo run validation:");
    console.log("1. Sign up at https://www.scrapin.io/pricing ($30 trial)");
    console.log("2. Add SCRAPIN_API_KEY=your_key to .env.local");
    console.log("3. Run: npx tsx scripts/validate-scrapin.ts");
    console.log("\nProceeding with MockProvider as fallback per project decision.");
    process.exit(0);
  }

  const result = await runValidation();

  // --- Verdict ---
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(60));
  console.log(`Can filter by company:       ${formatBool(result.canFilterByCompany)}`);
  console.log(`Includes former employees:   ${formatBool(result.includesFormerEmployees)}`);
  console.log(`Has career history:          ${formatBool(result.hasCareerHistory)}`);
  console.log(`Shows post-departure jobs:   ${formatBool(result.showsPostDepartureJobs)}`);
  console.log(`Result count:                ${result.resultCount ?? "N/A"}`);
  console.log(`Avg latency:                 ${result.avgLatencyMs ?? "N/A"}ms`);

  if (result.sampleData.length > 0) {
    console.log("\nSample career transitions:");
    for (const sample of result.sampleData) {
      console.log(`  ${sample}`);
    }
  }

  if (result.errors.length > 0) {
    console.log("\nErrors:");
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  // Overall pass/fail
  const passed =
    result.canFilterByCompany === true &&
    result.hasCareerHistory === true &&
    result.showsPostDepartureJobs === true;

  console.log("\n" + "=".repeat(60));
  if (passed) {
    console.log("VERDICT: PASS -- ScrapIn can answer 'where did people go?'");
    console.log("Recommendation: Use ScrapInProvider as primary data source.");
  } else {
    console.log("VERDICT: FAIL -- ScrapIn cannot fully answer the core question");
    console.log("Recommendation: Use MockProvider. Investigate Bright Data as alternative.");
    if (!result.canFilterByCompany) {
      console.log("  - Could not search by company name");
    }
    if (!result.hasCareerHistory) {
      console.log("  - Career history not available in responses");
    }
    if (!result.showsPostDepartureJobs) {
      console.log("  - Cannot determine where people went after leaving");
    }
  }
  console.log("=".repeat(60));

  process.exit(passed ? 0 : 1);
}

function formatBool(value: boolean | null): string {
  if (value === null) return "UNKNOWN";
  return value ? "YES" : "NO";
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
