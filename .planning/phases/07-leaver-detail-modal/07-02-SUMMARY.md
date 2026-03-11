---
phase: 07-leaver-detail-modal
plan: 02
subsystem: ui
tags: [react, dialog, timeline, auth-gate, shadcn, modal]

# Dependency graph
requires:
  - phase: 07-leaver-detail-modal/01
    provides: getLeaversForMigration server action, leaver/position DB tables, migration ID plumbing
  - phase: 06-sankey-interactions
    provides: DrillDownProvider, CompanyGrid/CompanyCard component chain
provides:
  - Clickable roles in company cards with hover underline
  - LeaverModal dialog with vertical career timelines
  - Auth-gated PII (blurred names, frosted overlay, sign-up CTA)
  - Source company highlighting in timeline (blue dots)
affects: [08-bidirectional-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Controlled Dialog modal with race-condition-safe data fetching"
    - "Auth-aware client rendering via authClient.useSession()"
    - "Prop drilling through CompanyGrid > CompanyCard > RoleList for click callbacks"
    - "Source company timeline highlighting with 3-state dot colors"

key-files:
  created:
    - src/components/results/leaver-modal.tsx
    - src/components/results/leaver-timeline.tsx
    - src/components/results/auth-gate-overlay.tsx
  modified:
    - src/components/results/role-list.tsx
    - src/components/results/company-card.tsx
    - src/components/results/company-grid.tsx
    - src/components/results/results-dashboard.tsx
    - src/actions/leavers.ts
    - src/lib/data/providers/mock.ts

key-decisions:
  - "sourceCompany prop threaded through modal/timeline for 3-color dot system (black=current, blue=source, open=other)"
  - "Mock data generates source company role as last timeline position for realistic career paths"
  - "Error handling wraps DB queries in getLeaversForMigration for graceful local dev without tables"

patterns-established:
  - "3-state timeline dots: filled primary (current), filled blue (source company), open (other history)"
  - "LinkedIn label on external links for clarity"

requirements-completed: [LVRD-01, LVRD-02, LVRD-03, LVRD-04, LVRD-05]

# Metrics
duration: 8min
completed: 2026-03-11
---

# Phase 7 Plan 2: Modal UI Summary

**Clickable role rows open a Dialog modal with vertical career timelines, auth-gated PII blurring, and source company dot highlighting**

## Performance

- **Duration:** ~8 min (continuation from checkpoint)
- **Started:** 2026-03-11T19:00:00Z
- **Completed:** 2026-03-11T19:10:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Roles in company cards are clickable with hover underline and pointer cursor
- Dialog modal shows individual leavers with vertical career timelines (filled/open/blue dots)
- Auth-gating works: blurred name + frosted glass overlay for unauthenticated users, full names + LinkedIn links for authenticated
- Source company positions highlighted with blue dots in timeline for visual context
- Modal state is orthogonal to Sankey drill-down (no cross-contamination)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build modal components** - `63a835d` (feat)
2. **Task 2: Wire role clicks through component chain** - `366b34c` (feat)
3. **Task 3: Visual verification polish** - `87becfe` (fix)

## Files Created/Modified
- `src/components/results/leaver-modal.tsx` - Dialog wrapper with auth-aware rendering, race-condition-safe fetching
- `src/components/results/leaver-timeline.tsx` - Vertical timeline with 3-state dot colors
- `src/components/results/auth-gate-overlay.tsx` - Frosted glass overlay with sign-up CTA
- `src/components/results/role-list.tsx` - Added onRoleClick handler and hover underline styles
- `src/components/results/company-card.tsx` - Passes onRoleClick and migrationIds to RoleList
- `src/components/results/company-grid.tsx` - Bridges role click callbacks with company context
- `src/components/results/results-dashboard.tsx` - Modal state management, sourceCompany prop
- `src/actions/leavers.ts` - Error handling for missing tables in local dev
- `src/lib/data/providers/mock.ts` - Source company role in timeline, improved position ordering

## Decisions Made
- Added sourceCompany prop through the modal/timeline chain so timelines can highlight where the person came from (blue dot) vs where they are now (black dot) vs other history (open dot)
- Mock data restructured to always include the source company role as the last timeline position for realistic career paths
- Error handling added to getLeaversForMigration to gracefully handle missing leaver tables in local dev

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Source company context in timeline**
- **Found during:** Task 3 (verification)
- **Issue:** Timeline had no visual indication of which position was at the source company the user searched for
- **Fix:** Added sourceCompany prop and blue dot highlighting for source company positions
- **Files modified:** leaver-modal.tsx, leaver-timeline.tsx, results-dashboard.tsx
- **Verification:** Visual inspection confirmed 3-state dot system works
- **Committed in:** 87becfe

**2. [Rule 2 - Missing Critical] Mock data missing source company in timeline**
- **Found during:** Task 3 (verification)
- **Issue:** Mock leaver positions didn't include the source company role, making timelines unrealistic
- **Fix:** Restructured mock position generation to include source company as last position
- **Files modified:** src/lib/data/providers/mock.ts
- **Committed in:** 87becfe

**3. [Rule 1 - Bug] getLeaversForMigration crashes without leaver tables**
- **Found during:** Task 3 (verification)
- **Issue:** Server action threw unhandled error when leaver/position tables don't exist in local dev
- **Fix:** Wrapped DB queries in try/catch returning empty results
- **Files modified:** src/actions/leavers.ts
- **Committed in:** 87becfe

---

**Total deviations:** 3 auto-fixed (2 missing critical, 1 bug)
**Impact on plan:** All fixes improve UX and dev experience. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All leaver detail modal features complete (LVRD-01 through LVRD-05)
- Ready for Phase 8: Bidirectional Sync (search result <-> leaver data refresh)
- All 197 tests pass, build succeeds

---
*Phase: 07-leaver-detail-modal*
*Completed: 2026-03-11*
