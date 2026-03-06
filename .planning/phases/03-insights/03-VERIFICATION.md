---
phase: 03-insights
verified: 2026-03-06T15:38:00Z
status: passed
score: 9/9 must-haves verified
---

# Phase 3: Insights Verification Report

**Phase Goal:** User gets actionable pattern analysis that transforms raw migration data into career intelligence
**Verified:** 2026-03-06T15:38:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | computeTopDestinations returns top 5 companies ranked by headcount with percentages | VERIFIED | Function at L257-285 of insights.ts; aggregates by company, Math.round percentages, sorts desc, slices to MAX_TOP_DESTINATIONS. 8 tests pass. |
| 2 | computeRoleBuckets classifies roles into Leadership/Business/Technical/Same role buckets | VERIFIED | classifyRole (L47-69) with priority Same role > Leadership > Technical > Business; computeRoleBuckets (L75-119) aggregates, filters 0%, sorts desc. 20 tests pass. |
| 3 | generatePatternSummary produces 2-3 sentence template-based summaries | VERIFIED | Function at L133-216 with 4 notability-scored pattern candidates, sorted and sliced to top 3. 6 tests pass. |
| 4 | Empty/small migration arrays are handled gracefully without NaN or crashes | VERIFIED | Guard clauses return empty arrays/strings for empty input in all functions. Division by zero prevented by early returns. Tests confirm. |
| 5 | User sees a ranked list of top destination companies with percentages in the insights card | VERIFIED | InsightsCard Section 1 (L40-55 of insights-card.tsx) renders ordered list with rank number, company name, and percentage. |
| 6 | User sees career path buckets with percentages and example roles | VERIFIED | InsightsCard Section 2 (L63-85) renders 2-col/4-col grid with category name, percentage, and topRoles joined by comma. |
| 7 | User sees natural-language pattern summaries | VERIFIED | InsightsCard Section 3 (L94-101) renders patternSummary string as paragraph with muted styling. |
| 8 | Insights card appears above the Sankey diagram, below the results header | VERIFIED | results-dashboard.tsx L55 renders InsightsCard after ResultsHeader (L47-53) and before SankeyErrorBoundary (L57-61). |
| 9 | Insights card is hidden when there are no migration results | VERIFIED | results-dashboard.tsx L55: `{migrations.length > 0 && <InsightsCard insights={insights} />}` |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/insights.ts` | Pure computation functions for all insights | VERIFIED | 285 lines, 8 exports (5 functions, 3 types), imports MigrationRecord and seniority utils |
| `src/lib/__tests__/insights.test.ts` | Unit tests covering INSI-01, INSI-02, INSI-03 (min 80 lines) | VERIFIED | 355 lines, 38 tests across 4 describe blocks, all passing |
| `src/components/results/insights-card.tsx` | InsightsCard component rendering all three insight sections (min 40 lines) | VERIFIED | 105 lines, renders Top Destinations, Career Paths, Pattern Summary with conditional dividers |
| `src/components/results/results-dashboard.tsx` | Updated dashboard with InsightsCard integrated | VERIFIED | Imports computeInsights and InsightsCard, useMemo computation at L35-38, renders at L55 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| insights.ts | sankey-data.ts | imports MigrationRecord type | WIRED | `import type { MigrationRecord } from "./sankey-data"` |
| insights.ts | seniority.ts | imports normalizeRoleTitle and parseSeniorityLevel | WIRED | `import { normalizeRoleTitle, parseSeniorityLevel } from "./seniority"` |
| insights-card.tsx | insights.ts | imports InsightsData type | WIRED | `import type { InsightsData } from "@/lib/insights"` |
| results-dashboard.tsx | insights.ts | imports computeInsights | WIRED | `import { computeInsights } from "@/lib/insights"` |
| results-dashboard.tsx | insights-card.tsx | renders InsightsCard with computed data | WIRED | `<InsightsCard insights={insights} />` at L55 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INSI-01 | 03-01, 03-02 | User sees a ranked list of top destination companies | SATISFIED | computeTopDestinations returns ranked companies; InsightsCard Section 1 renders them with percentages |
| INSI-02 | 03-01, 03-02 | User sees common role transitions (what roles people moved into) | SATISFIED | classifyRole + computeRoleBuckets classify into 4 categories; InsightsCard Section 2 renders grid with percentages and example roles |
| INSI-03 | 03-01, 03-02 | User sees pattern summaries | SATISFIED | generatePatternSummary produces 2-3 notability-ranked sentences; InsightsCard Section 3 renders as paragraph |

No orphaned requirements found. REQUIREMENTS.md maps INSI-01, INSI-02, INSI-03 to Phase 3, all accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | - | - | No anti-patterns detected |

No TODOs, FIXMEs, placeholders, empty implementations, or console.log-only handlers found in any phase 3 files.

### Human Verification Required

### 1. Visual Presentation of InsightsCard

**Test:** Run `npm run dev`, search for a company/role, verify the InsightsCard renders with correct layout above the Sankey diagram
**Expected:** Card shows three sections (Top Destinations ranked list, Career Paths grid, Pattern Summary paragraph) with compact styling and conditional dividers
**Why human:** Visual layout, spacing, typography, and readability cannot be verified programmatically

### 2. Pattern Summary Readability

**Test:** Read the generated pattern summary sentences on a real search result
**Expected:** Sentences feel natural and lead with the most interesting pattern (e.g., concentration or role change frequency)
**Why human:** Natural language quality and "smart friend summarizing data" tone require subjective judgment

### Gaps Summary

No gaps found. All 9 observable truths verified with concrete code evidence. All 3 requirements (INSI-01, INSI-02, INSI-03) satisfied with both computation engine and UI component. All 5 key links wired. All 38 unit tests passing. No anti-patterns detected.

The pre-existing TypeScript errors in `cache-manager.test.ts` are from a prior phase and do not affect phase 3 artifacts.

---

_Verified: 2026-03-06T15:38:00Z_
_Verifier: Claude (gsd-verifier)_
