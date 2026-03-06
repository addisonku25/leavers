---
phase: 01-foundation-data-pipeline
plan: 01
subsystem: data-pipeline
tags: [nextjs, typescript, fuse.js, drizzle, turso, upstash-redis, zod, vitest, biome, shadcn-ui, tailwind-v4]

# Dependency graph
requires: []
provides:
  - "DataProvider interface contract (types.ts)"
  - "CareerMigration and MigrationSearchParams types"
  - "MockProvider implementing DataProvider"
  - "Fuse.js fuzzy role matching with 50+ synonym entries"
  - "Cache-aside manager (Redis -> Provider) with normalized keys"
  - "Drizzle schema: searches + migrations tables"
  - "Zod search validation schema (shared client/server)"
  - "Seed data: 165 companies, 111 roles"
  - "shadcn/ui components: button, input, command, skeleton, card"
affects: [01-02, 01-03, 02-01]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19.2.3, drizzle-orm, @libsql/client, @upstash/redis, fuse.js@7, zod@4, react-hook-form@7, @hookform/resolvers, nanoid, shadcn-ui, biome@2.4.6, vitest@4, tailwindcss@4]
  patterns: [provider-adapter, cache-aside, tdd-red-green, normalized-cache-keys]

key-files:
  created:
    - src/lib/data/types.ts
    - src/lib/data/providers/mock.ts
    - src/lib/matching/fuzzy.ts
    - src/lib/matching/synonyms.ts
    - src/lib/cache/cache-manager.ts
    - src/lib/cache/redis.ts
    - src/lib/db/schema.ts
    - src/lib/db/index.ts
    - src/lib/validations/search.ts
    - src/data/companies.json
    - src/data/roles.json
    - vitest.config.ts
    - biome.json
    - drizzle.config.ts
  modified:
    - package.json

key-decisions:
  - "Redis client returns null instead of throwing when credentials missing (graceful degradation)"
  - "Biome 2.x with tailwindDirectives enabled for CSS @apply support"
  - "Cache manager defers Turso tier to Plan 01-02 when search server action provides full DB flow"
  - "MockProvider uses deterministic hash for stable test data"

patterns-established:
  - "Provider adapter: all data sources implement DataProvider interface"
  - "Cache-aside: check Redis -> fallback to provider -> store in Redis"
  - "Normalized cache keys: lowercase, trim, collapse whitespace, format company:role"
  - "TDD workflow: failing tests first, then implementation"

requirements-completed: [DATA-02, DATA-04, DATA-05]

# Metrics
duration: 13min
completed: 2026-03-06
---

# Phase 1 Plan 1: Project Scaffold & Data Pipeline Core Summary

**Next.js 15 project with Fuse.js fuzzy role matching (50+ synonym entries), cache-aside manager (Redis -> Provider), MockProvider implementing DataProvider interface, and 19 passing TDD tests**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-06T16:18:00Z
- **Completed:** 2026-03-06T16:31:00Z
- **Tasks:** 2
- **Files modified:** 34 (task 1), 8 (task 2)

## Accomplishments
- Scaffolded full Next.js 15 project with TypeScript, Tailwind CSS 4, shadcn/ui, Biome, Vitest
- Built DataProvider interface contract that all future providers (ScrapIn, Bright Data, mock) implement
- Fuzzy role matching with Fuse.js correctly maps abbreviations (SWE, PM, Sr. SE) and synonyms to canonical titles
- Cache-aside manager implements Redis-first lookup with provider fallback and key normalization
- MockProvider returns deterministic, realistic career migration data for any company+role input
- All 19 tests passing across fuzzy matching, provider compliance, and cache cascade logic
- Seed data: 165 companies (FAANG, consulting, banks, PE/VC, tech) and 111 role titles

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project** - `56292a7` (feat)
2. **Task 2: RED - Failing tests** - `466f36b` (test)
3. **Task 2: GREEN - Implementation** - `ac6cbda` (feat)

## Files Created/Modified
- `src/lib/data/types.ts` - DataProvider interface, CareerMigration, MigrationSearchParams, SearchResult types
- `src/lib/data/providers/mock.ts` - MockProvider with deterministic hash-based mock data
- `src/lib/matching/fuzzy.ts` - Fuse.js role matcher with score filtering
- `src/lib/matching/synonyms.ts` - 50+ canonical roles with 3-8 synonyms each
- `src/lib/cache/cache-manager.ts` - getCachedOrFetch with buildCacheKey normalization
- `src/lib/cache/redis.ts` - Upstash Redis client with graceful null fallback
- `src/lib/db/schema.ts` - Drizzle schema for searches and migrations tables
- `src/lib/db/index.ts` - Drizzle/Turso client with local SQLite fallback
- `src/lib/validations/search.ts` - Zod 4 search schema (company + role)
- `src/data/companies.json` - 165 company names across tech, consulting, finance, VC/PE
- `src/data/roles.json` - 111 role titles across engineering, product, sales, consulting, finance
- `vitest.config.ts` - Vitest with React plugin, jsdom, path aliases
- `biome.json` - Biome 2.x with tailwindDirectives, space indent, 100 line width
- `drizzle.config.ts` - Drizzle Kit config for SQLite/Turso

## Decisions Made
- **Redis graceful degradation:** Redis client returns null (not throw) when env vars missing, allowing local dev without Redis
- **Biome 2.x over ESLint:** Biome v2.4.6 installed (plan referenced v1.9 schema); updated config for v2 API including `tailwindDirectives` for CSS @apply support
- **Turso cache tier deferred:** Cache manager implements Redis + Provider tiers now; Turso persistent cache tier will be added in Plan 01-02 when the search server action provides the full DB insert/query flow with search IDs
- **Deterministic mock data:** MockProvider uses a simple hash of `company:role` to generate consistent results, ensuring test stability without randomness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome 2.x config schema mismatch**
- **Found during:** Task 1 (tooling configuration)
- **Issue:** Plan referenced Biome 1.9 schema; installed version is 2.4.6 with different config API (`files.ignore` replaced by `files.includes`, `organizeImports` moved to `assist.actions.source`)
- **Fix:** Updated biome.json schema to 2.4.6, restructured config for v2 API, enabled `tailwindDirectives` CSS parser option
- **Files modified:** biome.json
- **Verification:** `npx biome check .` passes clean
- **Committed in:** 56292a7 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Config-only fix, no scope creep. Required because Biome v2 was installed vs v1 referenced in plan.

## Issues Encountered
- `create-next-app` refused to scaffold into directory with existing `.planning/` folder; resolved by temporarily moving `.planning/` and `.git/` during scaffolding

## User Setup Required
None - no external service configuration required for local development. Redis and Turso both have graceful fallbacks.

## Next Phase Readiness
- DataProvider interface ready for ScrapIn provider implementation (Plan 01-02)
- Cache manager ready to wire Turso persistent tier when search action is built (Plan 01-02)
- Zod search schema ready for React Hook Form integration (Plan 01-03)
- shadcn/ui components installed for search form UI (Plan 01-03)
- Seed data ready for suggestion dropdowns (Plan 01-03)

---
*Phase: 01-foundation-data-pipeline*
*Completed: 2026-03-06*
