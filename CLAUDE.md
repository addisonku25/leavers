# CLAUDE.md — Leavers

## What This Is

A Next.js web app that shows users where people with similar roles at their company have gone next. Users search by company + role, and the app returns career migration patterns: destination companies, roles, flow visualizations, and actionable insights.

**Core value:** Turn career anxiety into actionable intelligence by showing concrete evidence of where people like you ended up.

## Project Status

v1.0 is feature-complete (all 4 phases done). All 23 requirements implemented. See `.planning/` for full history.

**Known blockers for production:**
- BrightData People Profile requires LinkedIn URLs as input — need a discovery mechanism for real searches
- Vercel free tier 10-second timeout may be insufficient for on-demand data fetching

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui components, Geist font
- **Database:** Turso (libSQL/SQLite) via Drizzle ORM
- **Cache:** Upstash Redis (30-day TTL)
- **Auth:** Better Auth (email/password)
- **Rate Limiting:** Upstash Ratelimit
- **Data Viz:** d3-sankey + d3-shape (React SVG)
- **Search:** Fuse.js fuzzy matching + synonym tables
- **Linting/Formatting:** Biome (spaces, 2-indent, 100 line width)
- **Testing:** Vitest + React Testing Library (jsdom)
- **Package Manager:** npm

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run test         # Run all tests (vitest run)
npm run test:watch   # Watch mode tests
npm run lint         # Biome check
npm run format       # Biome format (auto-fix)
npm run db:push      # Push schema to database (drizzle-kit push)
```

## Project Structure

```
src/
  app/                        # Next.js App Router pages
    page.tsx                  # Landing page with search form
    layout.tsx                # Root layout (NavBar + Footer)
    results/[id]/page.tsx     # Results dashboard (dynamic route)
    login/page.tsx            # Login page
    signup/page.tsx           # Signup page
    saved/page.tsx            # Saved searches page
    terms/page.tsx            # Terms of service
    privacy/page.tsx          # Privacy policy
    api/auth/[...all]/route.ts # Better Auth catch-all route
  actions/
    search.ts                 # Search server action (returns { searchId })
    saved-searches.ts         # Save/delete/list saved searches
  components/
    search-form.tsx           # Company + role search form
    search-suggestions.tsx    # cmdk autocomplete
    search-progress.tsx       # Optimistic timed progress steps
    save-search-button.tsx    # Save/unsave toggle
    nav-bar.tsx               # Persistent navigation
    footer.tsx                # Persistent footer
    auth/                     # Login/signup forms (react-hook-form + zod)
    results/                  # Dashboard components
      results-dashboard.tsx   # Main results orchestrator
      results-header.tsx      # Search summary header
      company-grid.tsx        # Destination companies grid
      company-card.tsx        # Individual company card
      role-list.tsx           # Role list within company card
      seniority-dot.tsx       # Seniority indicator
      sankey-diagram.tsx      # Sankey flow visualization
      sankey-error-boundary.tsx
      insights-card.tsx       # Pattern analysis card
      empty-state.tsx         # No results guidance
  lib/
    data/
      types.ts                # Core interfaces (CareerMigration, DataProvider, etc.)
      provider-factory.ts     # Provider resolution from DATA_PROVIDER env var
      providers/
        mock.ts               # Deterministic fake data (default for dev)
        brightdata.ts         # BrightData (~$0.001/record)
        scrapin.ts            # ScrapIn (~$0.01/record)
    db/
      index.ts                # Drizzle client (Turso)
      schema.ts               # All tables (searches, migrations, user, session, account, verification, saved_searches)
    matching/
      fuzzy.ts                # Fuse.js fuzzy role matching
      synonyms.ts             # Role synonym/abbreviation tables
    cache/
      redis.ts                # Upstash Redis client (returns null when env vars missing)
      cache-manager.ts        # Two-tier cache (Redis + Turso)
    auth.ts                   # Better Auth server config
    auth-client.ts            # Better Auth client
    rate-limit.ts             # Rate limiters (null when Redis unavailable)
    insights.ts               # Pattern analysis engine
    sankey-data.ts            # Sankey data builder
    seniority.ts              # Seniority level parsing/comparison
    utils.ts                  # cn() utility
    validations/search.ts     # Zod search schemas
  data/
    companies.json            # Autocomplete suggestions
    roles.json                # Autocomplete suggestions
```

## Architecture

### Data Flow
1. User submits company + role via search form
2. Server action generates cache key, checks Redis then Turso for cached results
3. On cache miss: fetches from configured DataProvider (mock/brightdata/scrapin)
4. Results stored in `searches` + `migrations` tables with 30-day TTL
5. Returns `{ searchId }` — client does `router.push(/results/${searchId})`
6. Results page loads data, transforms into company cards + Sankey + insights

### Key Patterns
- **Provider abstraction:** `DataProvider` interface — swap sources via `DATA_PROVIDER` env var
- **Graceful degradation:** Redis client and rate limiters return null when env vars missing (local dev works without Redis)
- **Server actions over API routes** for search and saved searches
- **Path alias:** `@/` maps to `src/`
- **Auth tables use `timestamp_ms` mode** (Better Auth requirement); app tables use `timestamp`

## Environment Variables

See `.env.example`. For local dev, only `TURSO_DATABASE_URL=file:local.db` and `DATA_PROVIDER=mock` are needed. Redis/auth features degrade gracefully without their env vars.

## Testing

Tests live in `__tests__/` directories adjacent to their source. Test files follow `*.test.ts(x)` pattern. The project uses Vitest with jsdom environment and React Testing Library for component tests.

## GSD Workflow

This project uses the GSD (Get Stuff Done) workflow. Planning docs live in `.planning/`:
- `PROJECT.md` — Project definition, requirements, constraints
- `ROADMAP.md` — Phase breakdown with success criteria
- `REQUIREMENTS.md` — Full requirement traceability
- `STATE.md` — Current progress and accumulated decisions
- `phases/` — Per-phase context, research, plans, summaries, verification
