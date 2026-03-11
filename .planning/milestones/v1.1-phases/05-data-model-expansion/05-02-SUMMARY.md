---
phase: 05-data-model-expansion
plan: 02
subsystem: database
tags: [mock-provider, search-action, leavers, drizzle, tdd]

requires:
  - phase: 05-data-model-expansion (plan 01)
    provides: leavers and leaverPositions schema tables, DetailedLeaver/DetailedSearchResult types
provides:
  - MockProvider.searchDetailed returning deterministic fake leavers
  - Search action storing leaver records in DB linked to migrations via FK
  - Leaver cap enforcement (max 10 per migration)
affects: [06-sankey-interactions, 07-leaver-modal]

tech-stack:
  added: []
  patterns: [searchDetailed provider method, migration-to-leaver FK linkage via Map lookup, per-migration cap enforcement]

key-files:
  created: []
  modified:
    - src/lib/data/providers/mock.ts
    - src/actions/search.ts
    - src/lib/__tests__/provider.test.ts
    - src/lib/__tests__/search-action.test.ts

key-decisions:
  - "Redis caches only aggregate CareerMigration[] -- leaver PII stays in Turso only"
  - "Migration-to-leaver FK linkage via lowercase company:role Map lookup"

patterns-established:
  - "searchDetailed optional method: providers implement it to return individual leavers alongside aggregates"
  - "Leaver cap: max 10 stored per migration regardless of provider output"

requirements-completed: [DMOD-04, DMOD-01, DMOD-02]

duration: 3min
completed: 2026-03-07
---

# Phase 5 Plan 2: Mock Provider searchDetailed & Search Action Leaver Storage Summary

**MockProvider.searchDetailed generates 5-10 deterministic fake leavers per migration; search action stores them in Turso linked to migrations via FK**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T17:09:52Z
- **Completed:** 2026-03-07T17:13:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- MockProvider.searchDetailed returns deterministic DetailedSearchResult with obviously fake leavers (Test User N pattern)
- Search action wired to call searchDetailed when available, storing leavers + positions in DB
- Backward compatibility preserved: providers without searchDetailed use existing getCachedOrFetch path
- Cap enforcement: max 10 leavers stored per migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement searchDetailed on MockProvider** - `e62cc93` (feat)
2. **Task 2: Wire search action to store leaver records** - `d431d97` (feat)

_Both tasks followed TDD: tests written first (RED), then implementation (GREEN)._

## Files Created/Modified
- `src/lib/data/providers/mock.ts` - Added searchDetailed method and generateMockLeavers helper
- `src/actions/search.ts` - Added leaver storage logic with migration FK linkage and cap enforcement
- `src/lib/__tests__/provider.test.ts` - Added 9 tests for searchDetailed behavior
- `src/lib/__tests__/search-action.test.ts` - Added 3 tests for leaver storage, backward compat, and cap

## Decisions Made
- Redis caches only aggregate CareerMigration[] -- leaver PII stays in Turso only (keeps Redis small, avoids caching PII)
- Migration-to-leaver FK linkage uses lowercase company:role Map for O(1) lookup during leaver insertion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing build error in drizzle.config.ts (defineConfig import) -- unrelated to plan changes, not addressed

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Data pipeline complete: searches now produce both aggregate migrations and individual leaver records
- Ready for Phase 6 (Sankey interactions) and Phase 7 (leaver modal) which consume this data

---
*Phase: 05-data-model-expansion*
*Completed: 2026-03-07*

## Self-Check: PASSED
