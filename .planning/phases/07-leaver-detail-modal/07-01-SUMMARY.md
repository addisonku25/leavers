---
phase: 07-leaver-detail-modal
plan: 01
subsystem: api
tags: [server-actions, auth, pii-stripping, drizzle, privacy]

requires:
  - phase: 05-data-model-expansion
    provides: leavers and leaverPositions tables with migration FK
provides:
  - Auth-aware getLeaversForMigration server action with exported types
  - MigrationRecord type extended with id field for modal queries
  - Privacy policy covering individual career data display
affects: [07-leaver-detail-modal plan 02 (modal UI), 07-leaver-detail-modal plan 03 (integration)]

tech-stack:
  added: []
  patterns: [auth-aware PII stripping via conditional object construction]

key-files:
  created:
    - src/actions/leavers.ts
    - src/actions/__tests__/leavers.test.ts
  modified:
    - src/lib/sankey-data.ts
    - src/app/results/[id]/page.tsx
    - src/app/privacy/page.tsx
    - src/app/__tests__/legal-pages.test.tsx

key-decisions:
  - "PII fields omitted entirely (not nulled) from unauthenticated responses per PRIV-05"
  - "Response types exported for downstream modal UI consumption"

patterns-established:
  - "Auth-aware server action: check session, conditionally include PII fields in response objects"

requirements-completed: [LVRD-04, LVRD-06, PRIV-04, PRIV-05]

duration: 3min
completed: 2026-03-11
---

# Phase 7 Plan 1: Leaver Data Layer Summary

**Auth-aware server action for fetching leavers with PII stripping, migration ID plumbing through component chain, and privacy policy update for individual career data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T18:36:29Z
- **Completed:** 2026-03-11T18:39:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Server action `getLeaversForMigration` fetches leavers by migration ID with full position history
- PII fields (name, linkedinUrl) completely omitted from unauthenticated responses -- not nulled, absent
- MigrationRecord type extended with `id` field, threaded from DB through results page to dashboard
- Privacy policy updated with "Individual Career Data" section explaining auth-gated PII display

## Task Commits

Each task was committed atomically:

1. **Task 1: Create getLeaversForMigration server action** - `0d76bdb` (test: RED), `cf33b05` (feat: GREEN)
2. **Task 2: Plumb migration IDs and update privacy policy** - `be91232` (feat)

_Task 1 used TDD: failing tests first, then implementation._

## Files Created/Modified
- `src/actions/leavers.ts` - Auth-aware server action with exported response types
- `src/actions/__tests__/leavers.test.ts` - 7 test behaviors covering auth/unauth, PII, positions, empty state
- `src/lib/sankey-data.ts` - Added `id` field to MigrationRecord interface
- `src/app/results/[id]/page.tsx` - Include migration ID in data mapping to dashboard
- `src/app/privacy/page.tsx` - Added Individual Career Data section, updated date
- `src/app/__tests__/legal-pages.test.tsx` - Updated test for new privacy policy content

## Decisions Made
- PII fields omitted entirely from unauthenticated responses (not set to null) per PRIV-05 -- ensures no PII key exists in the serialized response
- Exported response types (PublicLeaver, AuthenticatedLeaver, LeaverModalData) so Plan 02 can import them directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated legal-pages test for new privacy content**
- **Found during:** Task 2 (privacy policy update)
- **Issue:** Existing test asserted privacy page doesn't mention "LinkedIn" -- now it does intentionally
- **Fix:** Replaced test with one validating the new "Individual Career Data" section exists
- **Files modified:** src/app/__tests__/legal-pages.test.tsx
- **Verification:** All 197 tests pass
- **Committed in:** be91232 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Test was for old privacy policy behavior; update was necessary and expected.

## Issues Encountered

- Pre-existing `drizzle.config.ts` type error in `npm run build` (defineConfig import) -- unrelated to our changes, confirmed by testing on clean main branch. Out of scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Server action ready for modal UI (Plan 02) to call
- Response types exported for direct import
- Migration IDs available in dashboard components for modal trigger

---
*Phase: 07-leaver-detail-modal*
*Completed: 2026-03-11*
