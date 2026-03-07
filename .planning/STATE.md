---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Deep Dive
status: defining
stopped_at: null
last_updated: "2026-03-07"
last_activity: 2026-03-07 -- Milestone v1.1 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-07)

**Core value:** Show users concrete evidence of where people like them ended up -- turning career anxiety into actionable intelligence.
**Current focus:** Defining requirements for v1.1 Deep Dive

## Current Position

Phase: Not started (defining requirements)
Plan: --
Status: Defining requirements
Last activity: 2026-03-07 -- Milestone v1.1 started

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 11 min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Data Pipeline | 3/3 | 53 min | 18 min |
| 2. Results & Visualization | 3/3 | 29 min | 10 min |
| 3. Insights & Intelligence | 2/2 | 8 min | 4 min |

**Recent Trend:**
- Last 5 plans: 02-01 (3 min), 02-02 (2 min), 02-03 (24 min), 03-01 (4 min), 03-02 (4 min)
- Trend: TDD computation plans are fast; UI/visualization plans take longer

*Updated after each plan completion*
| Phase 04 P03 | 2min | 2 tasks | 5 files |
| Phase 04 P04 | 2min | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Data pipeline is Phase 1 because it's the highest-risk component -- if ScrapIn can't answer "where did people go?", everything else is moot
- [Roadmap]: Auth deferred to Phase 4 to reduce friction and prove core value before adding accounts
- [Roadmap]: Privacy/anonymization (PRIV-01) placed in Phase 2 with results display since it's about what users see, not how data is stored
- [01-01]: Redis client returns null (not throw) when env vars missing for graceful local dev
- [01-01]: Cache manager defers Turso persistent tier to Plan 01-02 when search server action provides full DB flow
- [01-01]: MockProvider uses deterministic hash for stable test data
- [01-02]: Switched from ScrapIn to BrightData as recommended provider (~$0.001/record vs $0.01/record)
- [01-02]: BrightData People Profile requires LinkedIn URLs, not company+role search -- discovery step needed for production
- [01-02]: ScrapIn provider retained as alternative; MockProvider remains default for development
- [01-03]: Search action returns { searchId } instead of redirect() for proper back button support via client-side router.push()
- [01-03]: Optimistic timed progress steps shown during server action (Option A -- simpler architecture for v1)
- [01-03]: cmdk-based autocomplete for search suggestions with debounce and keyboard navigation
- [02-01]: Seniority uses ordered regex matching (most senior first) for correct keyword priority
- [02-01]: compareSeniority returns same-or-lower for empty/falsy sourceRole (graceful degradation)
- [02-01]: MigrationRecord interface as shared input type for data transformation functions
- [02-02]: ResultsLayout simplified -- header now rendered inside ResultsDashboard, not layout wrapper
- [02-02]: Layout widened from max-w-2xl to max-w-6xl for 3-column card grid
- [02-02]: SeniorityDot uses native title attribute for tooltip (lightweight v1, no library)
- [02-03]: Node-based hover highlighting instead of link-based for clearer visual feedback
- [02-03]: Merge similar roles by stripping seniority prefixes for cleaner Sankey grouping
- [02-03]: Share destination nodes across companies to show true flow patterns
- [02-03]: Alphabetical sorting of company and role nodes for predictable layout
- [03-01]: Business as default role category catch-all for unrecognized roles
- [03-01]: Notability scoring for pattern summary sentence ordering
- [03-01]: Seniority delta averaging across all migrations for trend detection
- [03-02]: Compact card layout with text-xs and tight spacing for ~40% vertical reduction per user feedback
- [03-02]: Career path grid uses 2-col mobile / 4-col desktop to fit all buckets in one row
- [04-02]: Footer uses flex column layout with min-h-screen for sticky bottom positioning
- [04-02]: Privacy policy uses generic "publicly available professional data" phrasing without naming sources
- [04-00]: All test stubs use it.todo() for Vitest recognition without failure
- [04-01]: Used Better Auth CLI-generated schema for exact column names and indexes
- [04-01]: timestamp_ms mode for auth tables (Better Auth requirement) vs timestamp for existing tables
- [04-01]: Suspense boundary wrapping SignupForm for useSearchParams SSR compatibility
- [04-01]: Auth forms use react-hook-form + zod validation + authClient methods pattern
- [04-03]: Rate limiters conditionally null when Redis unavailable for graceful local dev
- [04-03]: Structured rate limit errors (rate_limited_guest/auth + resetAt) for differentiated UI
- [04-04]: Optimistic delete with useTransition for instant feedback on saved search removal
- [04-04]: window.confirm for delete confirmation (simple v1 approach)
- [04-04]: SavedSearchList client wrapper to keep /saved page as server component

### Pending Todos

None yet.

### Blockers/Concerns

- BrightData People Profile dataset requires LinkedIn URLs as input -- need a discovery mechanism (company employees dataset or pre-collected URLs) for production use
- Vercel free tier 10-second timeout may be insufficient for on-demand data fetching. May need Pro ($20/mo) or background job architecture.

## Session Continuity

Last session: 2026-03-06T22:20:10.047Z
Stopped at: Completed 04-04-PLAN.md
Resume file: None
