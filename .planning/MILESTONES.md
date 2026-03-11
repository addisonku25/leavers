# Milestones

## v1.1 Deep Dive (Shipped: 2026-03-11)

**Phases:** 5-8 (4 phases, 7 plans)
**Timeline:** 5 days (2026-03-07 to 2026-03-11)
**Files changed:** 38 (+3,660 / -100)
**Codebase:** 8,717 LOC TypeScript

**Key accomplishments:**
- Leavers/positions tables with structured career history, extended DataProvider with `searchDetailed`
- DrillDownProvider (React Context + useReducer) for cross-component Sankey/card selection state
- Click-to-scroll, highlight, filter, and toggle interactions between Sankey diagram and company cards with motion layout animations
- Auth-gated leaver detail modal with career timelines, PII stripped server-side for unauthenticated users
- Bidirectional sync between company cards and Sankey diagram nodes

**Tech debt carried forward:**
- drizzle.config.ts defineConfig export error (pre-existing from v1.0)
- Test module resolution errors in phases 6 and 7
- Test type mismatch and unreachable code in phase 6 tests

---

