---
phase: 08-polish-bidirectional-sync
plan: 01
subsystem: ui
tags: [react, d3-sankey, drill-down, bidirectional-sync, context-reducer]

# Dependency graph
requires:
  - phase: 06-sankey-click-interactions
    provides: DrillDownProvider context, Sankey click handlers, card reordering
provides:
  - Bidirectional sync between company cards and Sankey diagram
  - Card-initiated company selection (nodeIndex-less dispatch)
  - Sankey node resolution from layout when nodeIndex is null
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optional nodeIndex in drill-down actions for card-initiated vs Sankey-initiated selection"
    - "Sankey resolves node index from layout nodes by name when not provided directly"

key-files:
  created: []
  modified:
    - src/components/results/drill-down-provider.tsx
    - src/components/results/company-card.tsx
    - src/components/results/company-grid.tsx
    - src/components/results/sankey-diagram.tsx
    - src/components/results/__tests__/drill-down-provider.test.tsx

key-decisions:
  - "nodeIndex made required in DrillDownState but optional in DrillDownAction -- state always has a resolved value, but dispatchers from cards can omit it"
  - "Sankey resolves nodeIndex via useMemo lookup on layout.nodes when action provides null"
  - "Scroll triggers on any selection change (type + value) rather than gating on null-to-non-null transition"

patterns-established:
  - "Card-to-diagram sync: dispatch action with null nodeIndex, let diagram resolve from layout"

requirements-completed: [SANK-05]

# Metrics
duration: ~15min
completed: 2026-03-11
---

# Phase 8 Plan 1: Bidirectional Card-to-Sankey Sync Summary

**Bidirectional drill-down sync: clicking company names in cards highlights corresponding Sankey nodes via optional nodeIndex dispatch and layout-based resolution**

## Performance

- **Duration:** ~15 min (across multiple sessions including visual verification)
- **Completed:** 2026-03-11
- **Tasks:** 2 (1 TDD implementation + 1 visual verification checkpoint)
- **Files modified:** 5

## Accomplishments
- Company names in card headers are now clickable buttons with hover underline, dispatching SELECT_COMPANY with null nodeIndex
- Sankey diagram resolves node index from layout when not provided, producing identical highlighting to direct Sankey clicks
- Scroll behavior improved to fire on any selection change, running concurrently with card reorder animation
- Toggle and switch-selection work identically from either direction (card or Sankey)

## Task Commits

Each task was committed atomically:

1. **Task 1: Bidirectional sync wiring and tests (TDD)**
   - `971d71b` (test) - Add failing tests for null nodeIndex in SELECT_COMPANY
   - `d240706` (feat) - Implement bidirectional sync between company cards and Sankey diagram
   - `780cf2c` (fix) - Resolve TypeScript errors in drill-down and sankey components
   - `2b73294` (fix) - Improve scroll behavior to scroll on any selection change
2. **Task 2: Visual verification** - Checkpoint approved by user (no commit)

## Files Created/Modified
- `src/components/results/drill-down-provider.tsx` - nodeIndex made required in state, optional in action types
- `src/components/results/__tests__/drill-down-provider.test.tsx` - 3 new test cases for null nodeIndex behavior
- `src/components/results/company-card.tsx` - Added onCompanyClick prop with hover underline button
- `src/components/results/company-grid.tsx` - Company click dispatch, simplified scroll logic
- `src/components/results/sankey-diagram.tsx` - useMemo-based nodeIndex resolution from layout nodes

## Decisions Made
- Made nodeIndex required in DrillDownState (always resolved) but optional in DrillDownAction (cards omit it) -- cleaner separation between intent and state
- Scroll behavior changed from "only on null-to-non-null transition" to "on any selection change" -- feels more responsive and avoids stale prevRef tracking
- Removed unused D3SankeyLink import and LayoutLink type during TypeScript fix pass

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript errors in drill-down and sankey components**
- **Found during:** Task 1 (after GREEN phase)
- **Issue:** nodeIndex change from optional to required in state type caused type mismatches in drill-down-provider.tsx and sankey-diagram.tsx had unused imports
- **Fix:** Made nodeIndex required in DrillDownState, removed unused LayoutLink type and D3SankeyLink import
- **Files modified:** src/components/results/drill-down-provider.tsx, src/components/results/sankey-diagram.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 780cf2c

**2. [Rule 1 - Bug] Scroll behavior not triggering for Sankey-initiated selections after refactor**
- **Found during:** Task 2 (visual verification)
- **Issue:** The null-to-non-null gating with nodeIndex check was too restrictive -- Sankey selections that changed company didn't re-scroll
- **Fix:** Simplified to scroll on any selection change (type + value), removed prevTypeRef tracking
- **Files modified:** src/components/results/company-grid.tsx
- **Verification:** Visual verification confirmed both directions work
- **Committed in:** 2b73294

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correct behavior. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- v1.1 Deep Dive milestone is now feature-complete
- All 17 v1.1 requirements implemented (SANK-05 was the last)
- Known production blockers remain: BrightData LinkedIn URL discovery, Vercel timeout limits

## Self-Check: PASSED

All 5 modified files verified present on disk. All 4 task commits (971d71b, d240706, 780cf2c, 2b73294) verified in git history.

---
*Phase: 08-polish-bidirectional-sync*
*Completed: 2026-03-11*
