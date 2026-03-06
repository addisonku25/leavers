---
phase: 04-auth-saved-searches-compliance
plan: 03
subsystem: api
tags: [rate-limiting, upstash, ratelimit, redis, security]

# Dependency graph
requires:
  - phase: 04-01
    provides: "Better Auth session + auth.api.getSession for user identification"
  - phase: 01-01
    provides: "Upstash Redis client for rate limit storage"
provides:
  - "Three rate limiter instances (guest search, auth search, auth endpoint)"
  - "Proxy protecting auth endpoints from brute-force"
  - "Search action rate limiting with auth-aware limits"
  - "UI feedback for rate-limited users (sign-up CTA for guests, countdown for auth)"
affects: [04-04, 04-05]

# Tech tracking
tech-stack:
  added: ["@upstash/ratelimit"]
  patterns: ["conditional limiter (null when Redis unavailable)", "proxy function for Next.js 16 middleware"]

key-files:
  created:
    - src/lib/rate-limit.ts
    - src/proxy.ts
  modified:
    - src/actions/search.ts
    - src/components/search-form.tsx
    - src/lib/__tests__/search-action.test.ts

key-decisions:
  - "Rate limiters conditionally null when Redis unavailable for graceful local dev"
  - "Structured rate limit errors (rate_limited_guest/auth + resetAt) for differentiated UI"

patterns-established:
  - "Conditional rate limiter pattern: export null when Redis missing, check null before .limit()"
  - "Auth-aware rate limiting: session check determines limiter + identifier"

requirements-completed: [PRIV-02]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 4 Plan 3: Rate Limiting Summary

**Upstash rate limiting with 3 tiers (guest 3/day, auth 50/hr, auth-endpoint 5/15min) and auth-aware UI feedback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T22:15:03Z
- **Completed:** 2026-03-06T22:17:28Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Three Upstash rate limiter instances with sliding windows, gracefully null when Redis unavailable
- Next.js 16 proxy protecting auth endpoints (5 attempts per 15 min per IP)
- Search action checks session to apply guest vs auth rate limits before processing
- UI shows sign-up CTA for rate-limited guests, countdown timer for rate-limited auth users

## Task Commits

Each task was committed atomically:

1. **Task 1: Rate limiter instances + proxy for auth endpoints** - `de838bc` (feat)
2. **Task 2: Integrate rate limiting into search action** - `29aa8be` (feat)

## Files Created/Modified
- `src/lib/rate-limit.ts` - Three rate limiter instances (guest, auth, endpoint) conditionally created
- `src/proxy.ts` - Next.js 16 proxy function for auth endpoint brute-force protection
- `src/actions/search.ts` - Rate limit check before search processing with auth-aware limits
- `src/components/search-form.tsx` - Rate limit error UI with sign-up CTA and countdown messages
- `src/lib/__tests__/search-action.test.ts` - Added mocks for headers, auth, and rate-limit modules

## Decisions Made
- Rate limiters export null (not throw) when Redis is unavailable, matching the existing redis client pattern from 01-01
- Structured error codes (rate_limited_guest/rate_limited_auth) with resetAt timestamp enable differentiated UI messaging
- Guest rate limit message includes sign-up link as conversion lever per project requirements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed search action test failures from new imports**
- **Found during:** Task 2 (Integrate rate limiting into search action)
- **Issue:** Existing search action tests failed because headers(), auth, and rate-limit modules were not mocked
- **Fix:** Added vi.mock for next/headers, @/lib/auth (null session), and @/lib/rate-limit (null limiters)
- **Files modified:** src/lib/__tests__/search-action.test.ts
- **Verification:** npm run test -- all 127 tests pass
- **Committed in:** 29aa8be (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test mock addition necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - rate limiting uses existing Upstash Redis infrastructure from Phase 1.

## Next Phase Readiness
- Rate limiting foundation complete for all three tiers
- Saved searches (04-04) can proceed -- rate limiting won't interfere with save operations
- Compliance/legal (04-05) can proceed independently

---
*Phase: 04-auth-saved-searches-compliance*
*Completed: 2026-03-06*

## Self-Check: PASSED
