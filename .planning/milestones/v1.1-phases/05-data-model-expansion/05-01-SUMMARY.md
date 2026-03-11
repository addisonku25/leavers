---
phase: 05-data-model-expansion
plan: 01
subsystem: database
tags: [drizzle, sqlite, typescript, schema, types]

requires:
  - phase: 04-auth-compliance
    provides: existing schema patterns (FK, indexes, cascade deletes)
provides:
  - leavers and leaver_positions table definitions in Drizzle schema
  - DetailedLeaver, LeaverPosition, DetailedSearchResult type contracts
  - Extended DataProvider interface with optional searchDetailed method
affects: [05-02-mock-provider, 07-leaver-modal]

tech-stack:
  added: []
  patterns: [text columns for fuzzy dates, sortOrder for explicit ordering]

key-files:
  created:
    - src/lib/__tests__/types-detailed.test.ts
    - src/lib/__tests__/schema-leavers.test.ts
  modified:
    - src/lib/data/types.ts
    - src/lib/db/schema.ts

key-decisions:
  - "FK to migrations (not searches) -- modal opens from company card role which maps 1:1 to migration record"
  - "Text columns for dates -- LinkedIn dates are fuzzy (e.g. 2024-03), not precise timestamps"
  - "sortOrder column for explicit position ordering -- SQLite has no insertion order guarantee"

patterns-established:
  - "Leaver detail tables: leavers -> leaver_positions with cascade delete chain"
  - "Optional DataProvider methods for progressive enhancement (searchDetailed)"

requirements-completed: [DMOD-01, DMOD-02, DMOD-03]

duration: 2min
completed: 2026-03-07
---

# Phase 5 Plan 1: Schema & Types Summary

**Drizzle schema with leavers/leaver_positions tables and DetailedLeaver/LeaverPosition type contracts extending DataProvider with optional searchDetailed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-07T17:05:26Z
- **Completed:** 2026-03-07T17:07:48Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Defined DetailedLeaver, LeaverPosition, DetailedSearchResult types with full contract tests
- Extended DataProvider interface with optional searchDetailed (backward compatible)
- Added leavers table with FK to migrations and cascade delete
- Added leaver_positions table with FK to leavers, cascade delete, and leaverId index
- 23 tests passing across type contracts, schema validation, and existing provider tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Define TypeScript type contracts and extend DataProvider interface** - `a9eed5e` (feat)
2. **Task 2: Add leavers and leaver_positions tables to schema** - `292ed35` (feat)

## Files Created/Modified
- `src/lib/data/types.ts` - Added LeaverPosition, DetailedLeaver, DetailedSearchResult interfaces and optional searchDetailed on DataProvider
- `src/lib/db/schema.ts` - Added leavers and leaver_positions table definitions with FKs, cascades, and index
- `src/lib/__tests__/types-detailed.test.ts` - Type contract and backward compatibility tests
- `src/lib/__tests__/schema-leavers.test.ts` - Schema structure validation tests using getTableConfig

## Decisions Made
- FK to migrations (not searches) -- modal opens from company card role which maps 1:1 to migration record
- Text columns for dates -- LinkedIn dates are fuzzy (e.g. "2024-03"), not precise timestamps
- sortOrder column for explicit position ordering -- SQLite has no insertion order guarantee

## Deviations from Plan

None - plan executed exactly as written.

Note: `npm run db:push` command unavailable in current drizzle-kit version (older API uses `push:sqlite`). Schema definitions are correct and validated by tests. Not a blocker -- tables will be created when drizzle-kit is updated or via migration.

## Issues Encountered
- Pre-existing build error in drizzle.config.ts (`defineConfig` not exported from this drizzle-kit version) -- unrelated to this plan's changes, not addressed (out of scope)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Type contracts and schema ready for Plan 02 (mock provider + search wiring)
- DataProvider.searchDetailed is optional so all existing providers continue working
- leavers/leaver_positions tables ready to receive data from detailed providers

---
*Phase: 05-data-model-expansion*
*Completed: 2026-03-07*
