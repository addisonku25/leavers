---
phase: 06-sankey-click-interactions
verified: 2026-03-07T17:02:00Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Click a company node in the Sankey diagram"
    expected: "Matching company card promotes to top with blue ring, others dim, page scrolls to cards section, Sankey node shows stroke outline"
    why_human: "Visual animation smoothness and scroll behavior cannot be verified programmatically"
  - test: "Click a role node (right column) in the Sankey diagram"
    expected: "Cards containing that role promote to top sorted by role count, matching role gets pill highlight, hidden roles auto-expand"
    why_human: "Visual pill highlight rendering and auto-expand behavior need visual confirmation"
  - test: "Click the same node again"
    expected: "Cards reset to default order, no ring/dim styling, Sankey stroke clears"
    why_human: "Toggle-off visual reset needs visual confirmation"
  - test: "Hover a different node while one is selected"
    expected: "Hover preview shows temporarily, then restores to selection on mouse-leave"
    why_human: "Layered hover/selection interaction is a real-time visual behavior"
---

# Phase 6: Sankey Click Interactions Verification Report

**Phase Goal:** Users can click Sankey diagram nodes to navigate, filter, and highlight the company card grid
**Verified:** 2026-03-07T17:02:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can click a company node and the matching card scrolls into view, highlights, and promotes to top | VERIFIED | `handleNodeClick` dispatches `SELECT_COMPANY` (sankey-diagram.tsx:138-143), `reorderCards` promotes matching card to index 0 with `isPromoted=true` (company-grid.tsx:32-52), `CompanyCard` applies `ring-2 ring-blue-500` when promoted (company-card.tsx:29), scroll-to-section via `scrollIntoView` (company-grid.tsx:108-109) |
| 2 | User can click a role node and cards containing that role filter to top with role highlighted | VERIFIED | `handleNodeClick` dispatches `SELECT_ROLE` for destination nodes (sankey-diagram.tsx:144-149), `reorderCards` promotes matching cards sorted by role count descending (company-grid.tsx:56-91), `highlightedRole` passed through `CompanyCard` to `RoleList` (company-card.tsx:42), role pill highlight with `bg-blue-50` applied (role-list.tsx:59-60), auto-expand for hidden roles (role-list.tsx:33-49) |
| 3 | Promoted/filtered cards animate smoothly (no layout jumps) | VERIFIED | Cards wrapped in `motion.div` with `layout` prop and eased transition `duration: 0.4, ease: [0.4, 0, 0.2, 1]` (company-grid.tsx:125-128), `AnimatePresence mode="popLayout"` wraps grid (company-grid.tsx:122) |
| 4 | User can click same node again to reset filter/highlight state | VERIFIED | Toggle logic in reducer: `SELECT_COMPANY` with same value returns `INITIAL_STATE` (drill-down-provider.tsx:31-33), same for `SELECT_ROLE` (drill-down-provider.tsx:37-39), source node click dispatches `CLEAR` (sankey-diagram.tsx:137). 10 unit tests covering toggle behavior pass. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/results/drill-down-provider.tsx` | DrillDownProvider context with useReducer, useDrillDown hook | VERIFIED | 71 lines, exports `DrillDownProvider`, `useDrillDown`, `drillDownReducer`, all types. Substantive reducer with 3 action types and toggle logic. Wired: imported by sankey-diagram.tsx, company-grid.tsx, results-dashboard.tsx |
| `src/components/results/sankey-diagram.tsx` | Click handlers on nodes, selectedNode stroke, layered hover+selection | VERIFIED | 346 lines, `handleNodeClick` function (line 134), stroke on selected node (line 257), layered `activeHighlightNode` (line 117). Wired: consumes `useDrillDown` |
| `src/components/results/results-dashboard.tsx` | DrillDownProvider wrapper around Sankey + cards | VERIFIED | 79 lines, `DrillDownProvider` wraps entire return JSX (line 52-77). Wired: imports from drill-down-provider.tsx |
| `src/components/results/company-grid.tsx` | Card reordering, motion wrappers, scroll-to-section | VERIFIED | 142 lines, `reorderCards` pure function (line 20-92), `useDrillDown` consumption (line 95), motion wrappers (line 122-137), scroll effect (line 106-112). Wired: consumes drill-down-provider, passes props to CompanyCard |
| `src/components/results/company-card.tsx` | Ring highlight, opacity dim, highlightedRole passthrough | VERIFIED | 46 lines, `isPromoted` -> `ring-2 ring-blue-500 shadow-md` (line 29), `isDimmed` -> `opacity-50` (line 30), passes `highlightedRole` to RoleList (line 42). Wired: receives props from CompanyGrid |
| `src/components/results/role-list.tsx` | Role pill highlight, auto-expand for hidden highlighted roles | VERIFIED | 83 lines, pill highlight `bg-blue-50` on matching role (line 59-60), auto-expand with `autoExpandedRef` tracking (line 33-49). Wired: receives `highlightedRole` from CompanyCard |
| `src/components/results/__tests__/drill-down-provider.test.tsx` | Unit tests for reducer logic and toggle behavior | VERIFIED | 176 lines, 10 tests passing |
| `src/components/results/__tests__/company-grid.test.tsx` | Card ordering logic tests | VERIFIED | 116 lines, 5 tests passing |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `sankey-diagram.tsx` | `drill-down-provider.tsx` | `useDrillDown()` hook | WIRED | Import on line 13, destructured on line 66, dispatch called in `handleNodeClick` (lines 137-149) |
| `results-dashboard.tsx` | `drill-down-provider.tsx` | `DrillDownProvider` wrapper | WIRED | Import on line 16, wraps JSX on lines 52/77 |
| `company-grid.tsx` | `drill-down-provider.tsx` | `useDrillDown()` for card reordering | WIRED | Import on lines 6-7, called on line 95, state drives `reorderCards` and `highlightedRole` |
| `company-grid.tsx` | `company-card.tsx` | `isPromoted`, `isDimmed`, `highlightedRole` props | WIRED | Props passed on lines 131-134, received and used in company-card.tsx lines 19-30 |
| `company-card.tsx` | `role-list.tsx` | `highlightedRole` prop passthrough | WIRED | Passed on line 42, received and used in role-list.tsx lines 24/59-60 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SANK-01 | 06-01 | Click company node to scroll/highlight/promote matching card | SATISFIED | Company node click dispatches SELECT_COMPANY, reorderCards promotes to top, ring highlight, scroll-to-section |
| SANK-02 | 06-02 | Click role node to filter cards with role highlighted | SATISFIED | Role node click dispatches SELECT_ROLE, cards with matching role promote sorted by count, role pill highlight, auto-expand |
| SANK-03 | 06-02 | Smooth animation (CSS transitions) | SATISFIED | motion/react layout animations, transition-all duration-400 on cards, transition-colors on role pills |
| SANK-04 | 06-01 | Click again to reset | SATISFIED | Toggle logic in reducer (same value -> CLEAR), source node click -> CLEAR, verified by 10 unit tests |

No orphaned requirements found -- REQUIREMENTS.md maps SANK-01 through SANK-04 to Phase 6, all accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| N/A | N/A | No anti-patterns found | -- | -- |

No TODOs, FIXMEs, placeholders, empty implementations, or console.log-only handlers found in any Phase 6 files.

### Build Status

The `npm run build` fails due to a pre-existing type error in `drizzle.config.ts` (`defineConfig` export). This file was last modified in Phase 1 (commit `fd78ac7`) and is unrelated to Phase 6 changes. The Phase 6 code compiles correctly -- all 190 tests pass including TypeScript compilation via Vitest.

### Human Verification Required

### 1. Company Node Click Interaction

**Test:** Click a company node (middle column) in the Sankey diagram on a results page with multiple companies
**Expected:** Matching company card promotes to top of grid with blue ring border, other cards dim to ~50% opacity, page scrolls smoothly to "Where they went" heading, Sankey node shows stroke outline
**Why human:** Visual animation smoothness, scroll behavior, and ring/dim appearance require visual confirmation

### 2. Role Node Click Interaction

**Test:** Click a role node (right column) in the Sankey diagram
**Expected:** Cards containing that role promote to top sorted by that role's count, matching role shows subtle blue background pill highlight, hidden roles behind "+N more" auto-expand
**Why human:** Pill highlight visibility, auto-expand animation, and card sorting visual need human eyes

### 3. Toggle Off Behavior

**Test:** Click the same node again (both company and role nodes), also click the source node
**Expected:** Cards reset to default order, ring/dim/pill styling clears, Sankey stroke clears
**Why human:** Reset animation and visual clearing need visual confirmation

### 4. Layered Hover + Selection

**Test:** With a node selected, hover a different node, then move mouse away
**Expected:** Hover preview temporarily shows the hovered node's connections, mouse-leave restores the selected node's visual state
**Why human:** Real-time hover/selection layering is a dynamic visual behavior

### Gaps Summary

No gaps found. All four success criteria from ROADMAP.md are satisfied at the code level. All four SANK requirements (SANK-01 through SANK-04) have implementation evidence. All artifacts exist, are substantive (no stubs), and are properly wired. All 190 tests pass with no regressions.

The only remaining verification is human confirmation of visual behavior (animation smoothness, scroll behavior, hover/selection layering).

---

_Verified: 2026-03-07T17:02:00Z_
_Verifier: Claude (gsd-verifier)_
