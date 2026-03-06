---
phase: 01-foundation-data-pipeline
plan: 02
subsystem: data
tags: [brightdata, scrapin, linkedin, data-provider, server-action, cache-aside, zod, tdd]

# Dependency graph
requires:
  - phase: 01-foundation-data-pipeline/01-01
    provides: DataProvider interface, MockProvider, cache-manager, Turso schema, fuzzy matching
provides:
  - BrightData provider implementing DataProvider for LinkedIn career data
  - ScrapIn provider implementing DataProvider (alternative)
  - Search server action wiring form submission to cache-aside pipeline
  - Provider factory supporting brightdata/scrapin/mock via env config
affects: [01-foundation-data-pipeline/01-03, 02-results-visualization]

# Tech tracking
tech-stack:
  added: [brightdata-api]
  patterns: [provider-factory, cache-aside-pipeline, server-action-with-redirect, tdd-red-green]

key-files:
  created:
    - src/lib/data/providers/brightdata.ts
    - src/lib/data/providers/scrapin.ts
    - src/actions/search.ts
    - src/lib/__tests__/search-action.test.ts
    - scripts/validate-scrapin.ts
    - scripts/validate-brightdata.ts
    - scripts/brightdata-response.json
  modified:
    - src/lib/data/provider-factory.ts
    - src/lib/__tests__/provider-factory.test.ts
    - .env.example

key-decisions:
  - "Switched from ScrapIn to BrightData as recommended provider (~$0.001/record vs $0.01/record)"
  - "BrightData People Profile requires LinkedIn URLs as input, not company+role search -- discovery step needed later"
  - "ScrapIn provider retained as alternative for users with existing API keys"
  - "MockProvider remains default (DATA_PROVIDER=mock) for development"
  - "Search action uses redirect() throw pattern for Next.js server-side navigation"

patterns-established:
  - "Provider factory: environment-driven provider resolution via DATA_PROVIDER env var"
  - "Server action pattern: validate -> create record -> fetch via cache -> store results -> redirect"
  - "TDD workflow: failing tests first, then minimal implementation to pass"

requirements-completed: [DATA-01, DATA-03]

# Metrics
duration: 15min
completed: 2026-03-06
---

# Phase 1 Plan 2: ScrapIn API Validation & Search Action Summary

**BrightData + ScrapIn providers with TDD search server action wiring form submission through cache-aside pipeline to Turso**

## Performance

- **Duration:** ~15 min (across checkpoint pause)
- **Started:** 2026-03-06T17:15:00Z
- **Completed:** 2026-03-06T17:36:09Z
- **Tasks:** 3 (Task 1 auto, Task 2 TDD red+green, Task 3 checkpoint continuation)
- **Files modified:** 11

## Accomplishments
- Validated BrightData API returns full LinkedIn experience arrays with title, company, start/end dates
- Implemented BrightData provider with sync/async response handling and null-experience graceful skipping
- Implemented ScrapIn provider with batched profile fetching and post-departure extraction
- Built search server action (TDD) that validates input, creates DB records, fetches via cache-aside, stores results, and redirects
- Provider factory supports three providers (brightdata, scrapin, mock) via DATA_PROVIDER env var
- All 30 tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Validate ScrapIn API and implement data provider** - `a9209ad` (feat)
2. **Task 2 RED: Search action failing tests** - `e04f24b` (test)
3. **Task 2 GREEN: Search action implementation** - `46499d0` (feat)
4. **Task 3: BrightData provider and provider factory update** - `83e36de` (feat)

## Files Created/Modified
- `src/lib/data/providers/brightdata.ts` - BrightData LinkedIn People Profile provider
- `src/lib/data/providers/scrapin.ts` - ScrapIn LinkedIn enrichment provider
- `src/lib/data/provider-factory.ts` - Environment-driven provider resolution (brightdata|scrapin|mock)
- `src/actions/search.ts` - Server action: validate -> DB record -> cache-aside fetch -> store -> redirect
- `src/lib/__tests__/search-action.test.ts` - 6 tests covering validation, DB records, status transitions, redirect
- `src/lib/__tests__/provider-factory.test.ts` - 5 tests including BrightData resolution
- `scripts/validate-scrapin.ts` - ScrapIn API validation script
- `scripts/validate-brightdata.ts` - BrightData API validation script
- `scripts/brightdata-response.json` - Real BrightData API response (Satya Nadella profile)
- `.env.example` - Updated with BrightData key documentation and provider options

## Decisions Made
- **Switched to BrightData as recommended provider**: 10x cheaper ($0.001 vs $0.01/record), validated API returns full experience arrays. ScrapIn retained as alternative.
- **BrightData requires LinkedIn URLs**: People Profile dataset scrapes by URL, not by company+role. A discovery step will be needed for production use. MockProvider handles company+role search for development.
- **redirect() throw pattern**: Next.js uses throw for server-side navigation. Search action re-throws NEXT_REDIRECT errors to avoid catching them in the try/catch block.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - New Provider] Added BrightData provider at user's direction**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** User validated BrightData API during checkpoint pause and decided to switch from ScrapIn
- **Fix:** Created BrightData provider, updated factory, updated .env.example
- **Files modified:** src/lib/data/providers/brightdata.ts, src/lib/data/provider-factory.ts, .env.example, src/lib/__tests__/provider-factory.test.ts
- **Verification:** All 30 tests pass including new BrightData factory test
- **Committed in:** 83e36de

---

**Total deviations:** 1 (user-directed provider addition during checkpoint)
**Impact on plan:** Additive change. ScrapIn provider still works. BrightData added as recommended alternative. No scope creep.

## Issues Encountered
- ScrapIn validation could not be fully automated since SCRAPIN_API_KEY was not available. User independently validated BrightData and chose to switch providers.

## User Setup Required

To use BrightData provider in production:
1. Sign up at https://brightdata.com (free trial)
2. Get API key from Account Settings -> API Keys
3. Add `BRIGHTDATA_API_KEY=your_key` to `.env.local`
4. Set `DATA_PROVIDER=brightdata` in `.env.local`

For development, `DATA_PROVIDER=mock` (the default) requires no external keys.

## Next Phase Readiness
- Search action is wired end-to-end and ready for UI integration in Plan 01-03
- Provider factory supports swapping data sources without code changes
- All 30 tests passing, providing confidence for UI layer development
- BrightData limitation (requires URLs, not company+role search) will need a discovery mechanism for production, but MockProvider covers development

---
*Phase: 01-foundation-data-pipeline*
*Completed: 2026-03-06*
