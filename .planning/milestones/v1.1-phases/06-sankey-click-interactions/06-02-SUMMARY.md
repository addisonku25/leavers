---
phase: 06-sankey-click-interactions
plan: 02
subsystem: ui
tags: [motion-react, layout-animation, drill-down, company-cards, reordering]

requires:
  - phase: 06-sankey-click-interactions
    plan: 01
    provides: DrillDownProvider context with selection state and Sankey click handlers
  - phase: 02-results-visualization
    provides: CompanyGrid, CompanyCard, RoleList components
provides:
  - Card reordering logic (reorderCards pure function) driven by DrillDownProvider selection state
  - Motion layout animations for smooth card position transitions
  - Ring highlight on promoted cards, opacity dim on non-promoted cards
  - Role pill highlight with auto-expand for hidden highlighted roles
  - Scroll-to-section behavior on Sankey node click
affects: [08-polish-bidirectional-sync]

tech-stack:
  added: [motion (motion/react)]
  patterns: [pure-function-extraction-for-testability, layout-animation-with-motion]

key-files:
  modified:
    - src/components/results/company-grid.tsx
    - src/components/results/company-card.tsx
    - src/components/results/role-list.tsx
  created:
    - src/components/results/__tests__/company-grid.test.tsx

key-decisions:
  - "Pure reorderCards function extracted for unit testability outside React rendering"
  - "motion/react layout prop for card position animations instead of manual CSS transitions"
  - "Auto-expand tracked via ref to avoid fighting with manual user expansion"
  - "mergeRolesByExactName instead of mergeRolesByNormalizedTitle to prevent incorrect Sankey node collapsing"

patterns-established:
  - "Pure function extraction: complex UI logic extracted as exported pure functions for direct unit testing"
  - "Motion layout animation: wrap grid items in motion.div with layout prop for automatic position transitions"

requirements-completed: [SANK-02, SANK-03]

duration: ~15min
completed: 2026-03-07
---

# Phase 6 Plan 02: Card Response to Sankey Selection Summary

**Company cards reorder, highlight, and animate in response to Sankey drill-down clicks via motion layout animations and a pure reorderCards function**

## Performance

- **Duration:** ~15 min (across checkpoint pause)
- **Tasks:** 2
- **Files modified:** 4
- **Files created:** 1

## Accomplishments
- Company cards promote to top position with blue ring highlight when their Sankey node is clicked
- Role node clicks promote matching cards sorted by role count, with role pill highlights and auto-expand for hidden roles
- Smooth layout animations via motion/react prevent jarring position jumps
- Toggle-off (re-click same node) resets cards to default order and styling
- Page auto-scrolls to company cards section on selection

## Task Commits

Each task was committed atomically:

1. **Task 1: Card reordering logic and motion animation wrappers**
   - `64a39a1` (test) - Failing tests for reorderCards pure function
   - `991859c` (feat) - Implementation: company-grid reordering, company-card highlight/dim, role-list pill highlight and auto-expand
2. **Task 2: Verify Sankey-to-card click interactions** - User-approved checkpoint (no code commit)

**Bug fix during verification:**
- `3cdb318` (fix) - Sankey mergeRolesByExactName replacing mergeRolesByNormalizedTitle

## Files Created/Modified
- `src/components/results/company-grid.tsx` - Added reorderCards(), useDrillDown integration, motion wrappers, scroll-to-section
- `src/components/results/company-card.tsx` - Added isPromoted ring, isDimmed opacity, highlightedRole passthrough
- `src/components/results/role-list.tsx` - Added role pill highlight, auto-expand for hidden highlighted roles
- `src/components/results/__tests__/company-grid.test.tsx` - Unit tests for reorderCards pure function
- `src/lib/sankey-data.ts` - Bug fix: mergeRolesByExactName (was incorrectly collapsing roles by seniority prefix)

## Decisions Made
- Extracted reorderCards as a pure function for direct unit testing without React rendering overhead
- Used motion/react layout prop rather than manual CSS transitions for position animation
- Tracked auto-expand state via useRef to avoid conflicting with manual user expansion
- Fixed Sankey role merging to use exact names (bug found during verification)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sankey merging roles by normalized seniority prefix**
- **Found during:** Task 2 (visual verification)
- **Issue:** mergeRolesByNormalizedTitle collapsed "Senior Software Engineer" and "Software Engineer" into one Sankey node
- **Fix:** Replaced with mergeRolesByExactName to preserve distinct role titles
- **Files modified:** src/lib/sankey-data.ts, src/lib/__tests__/sankey-data.test.ts
- **Verification:** Visual inspection confirmed distinct role nodes in Sankey
- **Committed in:** 3cdb318

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix -- role nodes must represent actual distinct roles.

## Issues Encountered
None beyond the Sankey role merging bug documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 complete -- all Sankey click interactions working end-to-end
- Phase 7 (Leaver Detail Modal) can proceed: drill-down context is available via DrillDownProvider
- Phase 8 (Bidirectional Sync) has card-to-Sankey direction remaining

## Self-Check: PASSED

All source files verified present. All commit hashes (64a39a1, 991859c, 3cdb318) found in git log.

---
*Phase: 06-sankey-click-interactions*
*Completed: 2026-03-07*
