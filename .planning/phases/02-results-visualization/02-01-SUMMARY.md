---
phase: 02-results-visualization
plan: 01
subsystem: data-transformation
tags: [seniority, sankey, drizzle, vitest, tdd]

requires:
  - phase: 01-foundation
    provides: "Database schema, search action, CareerMigration type, cache pipeline"
provides:
  - "sourceRole column on migrations table"
  - "Seniority parsing (parseSeniorityLevel, compareSeniority)"
  - "Company card grouping (groupMigrationsForCards)"
  - "Sankey diagram data builder (buildSankeyData)"
  - "CompanyCardData, SankeyData, SankeyNode, SankeyLink types"
affects: [02-02, 02-03, 02-04]

tech-stack:
  added: []
  patterns: [tdd-red-green, data-transformation-layer, seniority-keyword-matching]

key-files:
  created:
    - src/lib/seniority.ts
    - src/lib/sankey-data.ts
    - src/lib/__tests__/seniority.test.ts
    - src/lib/__tests__/sankey-data.test.ts
  modified:
    - src/lib/db/schema.ts
    - src/actions/search.ts

key-decisions:
  - "Seniority uses ordered regex matching (most senior first) for correct priority when titles contain multiple keywords"
  - "compareSeniority returns same-or-lower for empty/falsy sourceRole as graceful degradation"
  - "Sankey Other node includes company count in label for clarity"

patterns-established:
  - "TDD red-green for all pure logic modules"
  - "MigrationRecord interface as shared input type for data transformations"

requirements-completed: [SRCH-02, SRCH-03, SRCH-06, PRIV-01]

duration: 3min
completed: 2026-03-06
---

# Phase 2 Plan 1: Data Transformation Layer Summary

**Seniority parsing (0-9 levels), company card grouping, and 3-column Sankey data builder with top-8/top-5 limits**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T18:44:33Z
- **Completed:** 2026-03-06T18:47:09Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added sourceRole column to migrations schema and updated search action to persist it
- Built seniority parsing module covering intern through C-level (10 levels, regex-based keyword matching)
- Built data transformation layer: groupMigrationsForCards for card display, buildSankeyData for 3-column Sankey visualization
- 33 new tests (21 seniority + 12 sankey-data), full suite at 69 tests with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema migration + seniority parsing** - `bb4faff` (test: TDD RED) -> `8b53458` (feat: TDD GREEN)
2. **Task 2: Data transformation layer** - `2ffbfbf` (test: TDD RED) -> `3ebdd5e` (feat: TDD GREEN)

_TDD tasks each have two commits (failing test then implementation)._

## Files Created/Modified
- `src/lib/seniority.ts` - Seniority level parsing and comparison (0=intern to 9=C-level)
- `src/lib/sankey-data.ts` - groupMigrationsForCards and buildSankeyData transformations
- `src/lib/__tests__/seniority.test.ts` - 21 tests for seniority parsing and comparison
- `src/lib/__tests__/sankey-data.test.ts` - 12 tests for card grouping and Sankey data building
- `src/lib/db/schema.ts` - Added nullable sourceRole column to migrations table
- `src/actions/search.ts` - Updated migration insert to include sourceRole

## Decisions Made
- Seniority uses ordered regex matching (most senior first) so titles like "Senior VP" match VP level (7) not Senior level (3)
- compareSeniority returns "same-or-lower" for empty/falsy sourceRole -- graceful degradation when sourceRole data is missing from older records
- Sankey "Other" node label includes company count (e.g., "Other (2 companies)") for user clarity
- MigrationRecord interface created as shared input type for all data transformation functions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data transformation layer complete, ready for UI components (company cards, Sankey diagram, seniority dots)
- All types exported and tested for consumption by Plan 02-02 through 02-04

## Self-Check: PASSED

All 6 files verified present. All 4 task commits verified in git log.

---
*Phase: 02-results-visualization*
*Completed: 2026-03-06*
