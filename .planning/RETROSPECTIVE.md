# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 -- Deep Dive

**Shipped:** 2026-03-11
**Phases:** 4 | **Plans:** 7

### What Was Built
- Leavers/positions database tables with structured career history data
- DrillDownProvider (React Context + useReducer) for Sankey/card cross-component selection
- Click-to-scroll, highlight, filter, toggle interactions between Sankey and company cards
- Auth-gated leaver detail modal with career timelines and PII stripping
- Bidirectional sync between company cards and Sankey diagram

### What Worked
- Phase ordering: data model first (Phase 5), then UI interactions (6-8) -- modal had data ready when it was time to build
- Pure function extraction (reorderCards, reducer logic) made unit testing straightforward
- Server-side PII stripping approach (omit fields entirely, not null them) was clean and secure
- Small, focused plans (2-3 tasks each) executed quickly -- average ~7 min per plan
- motion/react layout prop for animations was simpler than manual CSS transitions

### What Was Inefficient
- Phase 5 plan checkboxes in ROADMAP.md were never checked off (stayed `[ ]` despite being complete)
- Some test files accumulated TypeScript diagnostics that weren't caught until audit (module resolution, type mismatches)
- Nyquist validation was skipped across all 4 phases -- VALIDATION.md files created but never completed

### Patterns Established
- DrillDownProvider pattern: React Context + useReducer for cross-component interactive state
- Auth-aware server actions: conditional field inclusion based on session status
- Optional nodeIndex pattern: UI components dispatch actions without knowing layout details; visualization resolves
- Text columns for fuzzy dates from LinkedIn data

### Key Lessons
1. Test file diagnostics should be checked after each phase, not just at audit time
2. Nyquist validation should run during phase execution, not deferred to milestone end
3. Bidirectional sync between disparate UI components benefits from a single shared reducer with optional fields per direction

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 MVP | 4 | 13 | Established GSD workflow, TDD for insights, Nyquist for auth |
| v1.1 Deep Dive | 4 | 7 | Leaner plans (~2-3 tasks), skipped Nyquist validation |

### Cumulative Quality

| Milestone | Tests | Test Files | Codebase LOC |
|-----------|-------|------------|--------------|
| v1.0 MVP | ~140 | ~14 | ~5,000 |
| v1.1 Deep Dive | 200 | 21 | 8,717 |

### Top Lessons (Verified Across Milestones)

1. Data model work before UI work prevents rework
2. Small, focused plans (2-3 tasks) execute faster and more reliably than large ones
3. Server-side data gating is cleaner than client-side -- strip at the source
