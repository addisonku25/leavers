---
phase: 04-auth-saved-searches-compliance
plan: 02
subsystem: ui
tags: [legal, terms, privacy, footer, next.js]

requires:
  - phase: 01-foundation-data-pipeline
    provides: Next.js app structure and layout
provides:
  - Terms of service page at /terms
  - Privacy policy page at /privacy
  - Site-wide footer component with legal links
affects: [04-auth-saved-searches-compliance]

tech-stack:
  added: []
  patterns: [flex column layout with sticky footer]

key-files:
  created:
    - src/app/terms/page.tsx
    - src/app/privacy/page.tsx
    - src/components/footer.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Footer uses flex column layout with min-h-screen for sticky bottom positioning"
  - "Privacy policy uses 'publicly available professional data' phrasing without naming any source"

patterns-established:
  - "Legal pages: centered prose layout with max-w-3xl, py-16, consistent section structure"
  - "Layout structure: flex min-h-screen flex-col with main flex-1 for footer positioning"

requirements-completed: [PRIV-03]

duration: 2min
completed: 2026-03-06
---

# Phase 4 Plan 02: Legal Pages & Footer Summary

**Terms of service and privacy policy pages with site-wide footer using flex column sticky layout**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T21:14:38Z
- **Completed:** 2026-03-06T21:16:21Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Terms of service page with 7 legal sections covering acceptance, service description, accounts, acceptable use, data accuracy, liability, and changes
- Privacy policy page with 8 sections covering data collection, usage, sources, aggregation, cookies, retention, rights, and contact -- no mention of LinkedIn
- Footer component with copyright and legal links, responsive layout
- Layout updated to flex column with sticky footer pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Terms of service and privacy policy pages** - `efe0943` (feat)
2. **Task 2: Footer component + layout integration** - `7940518` (feat)

## Files Created/Modified
- `src/app/terms/page.tsx` - Static terms of service page with metadata
- `src/app/privacy/page.tsx` - Static privacy policy page with metadata
- `src/components/footer.tsx` - Site-wide footer with legal links
- `src/app/layout.tsx` - Added Footer import and flex column layout

## Decisions Made
- Footer uses flex column layout with min-h-screen for sticky bottom positioning, ready for NavBar addition by Plan 01
- Privacy policy uses generic "publicly available professional data" phrasing per plan requirements
- Contact email set to privacy@leavers.app as placeholder

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Legal pages ready, footer visible on all pages
- Layout flex structure accommodates NavBar addition by Plan 01

## Self-Check: PASSED

All 4 files verified present. Both task commits (efe0943, 7940518) verified in git log.

---
*Phase: 04-auth-saved-searches-compliance*
*Completed: 2026-03-06*
