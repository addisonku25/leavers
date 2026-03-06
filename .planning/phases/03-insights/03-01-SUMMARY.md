---
phase: 03-insights
plan: 01
subsystem: computation
tags: [insights, pure-functions, tdd, role-classification, pattern-summary]

# Dependency graph
requires:
  - phase: 02-results
    provides: MigrationRecord type from sankey-data.ts, seniority functions from seniority.ts
provides:
  - computeTopDestinations: ranked companies with percentages
  - classifyRole: role category classification (Same role > Leadership > Technical > Business)
  - computeRoleBuckets: aggregated role category buckets with top roles
  - generatePatternSummary: 2-3 sentence natural-language pattern description
  - computeInsights: orchestrator returning InsightsData
affects: [03-02, 03-03, 04-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-computation, notability-scored-patterns, tdd-red-green-refactor]

key-files:
  created:
    - src/lib/insights.ts
    - src/lib/__tests__/insights.test.ts
  modified: []

key-decisions:
  - "Business as default role category catch-all for unrecognized roles"
  - "Notability scoring for pattern summary sentence ordering"
  - "Seniority delta averaging across all migrations for trend detection"

patterns-established:
  - "Pure computation functions with no side effects for testability"
  - "Guard clauses returning empty results for empty input arrays"
  - "Notability-scored pattern candidates sorted and sliced for summary generation"

requirements-completed: [INSI-01, INSI-02, INSI-03]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 3 Plan 1: Insights Computation Engine Summary

**Pure-function insights engine with role classification, top destinations, pattern summaries, and 38 TDD tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T20:23:33Z
- **Completed:** 2026-03-06T20:27:45Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- computeTopDestinations ranks companies by headcount with integer percentages, max 5
- classifyRole correctly prioritizes Same role > Leadership > Technical > Business with normalized matching
- computeRoleBuckets aggregates migrations into non-empty category buckets with top role names
- generatePatternSummary produces 2-3 notability-ranked natural-language sentences
- computeInsights orchestrates all computation, handles empty/small/normal datasets
- 38 comprehensive unit tests covering all edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: computeTopDestinations (INSI-01)** - `d8bddf8` (feat)
2. **Task 2: classifyRole + computeRoleBuckets (INSI-02)** - `13513f5` (feat)
3. **Task 3: generatePatternSummary + computeInsights (INSI-03)** - `dd21f5c` (feat)

## Files Created/Modified
- `src/lib/insights.ts` - Pure computation functions for all insights (types, constants, 6 exported functions)
- `src/lib/__tests__/insights.test.ts` - 38 unit tests covering INSI-01, INSI-02, INSI-03

## Decisions Made
- Business as default role category catch-all when no keyword matches (per research recommendation)
- Notability scoring system for pattern summary: concentration score = percentage, role change score = deviation from midpoint, seniority score = absolute delta * 10
- Seniority trend computed by averaging parseSeniorityLevel deltas across all migrations with sourceRole data
- Test for tied percentages uses unordered comparison since sort stability varies

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in `src/lib/__tests__/cache-manager.test.ts` (TS2532: Object is possibly 'undefined') -- out of scope, not caused by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All insight computation functions exported and ready for UI integration (Plan 03-02, 03-03)
- InsightsData type available for component props
- Pattern summary strings ready for direct rendering

## Self-Check: PASSED

All files and commits verified.

---
*Phase: 03-insights*
*Completed: 2026-03-06*
