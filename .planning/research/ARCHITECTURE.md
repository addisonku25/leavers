# Architecture Research

**Domain:** Career migration intelligence / talent data aggregation
**Researched:** 2026-03-06
**Confidence:** MEDIUM

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Search Form  │  │  Results     │  │  Insights    │              │
│  │  (Input)     │  │  Dashboard   │  │  Analytics   │              │
│  └──────┬───────┘  └──────▲───────┘  └──────▲───────┘              │
│         │                 │                 │                       │
├─────────┴─────────────────┴─────────────────┴───────────────────────┤
│                      Server Actions / API Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Search       │  │ Results      │  │ Insights     │              │
│  │ Action       │  │ Queries      │  │ Queries      │              │
│  └──────┬───────┘  └──────▲───────┘  └──────▲───────┘              │
│         │                 │                 │                       │
├─────────┴─────────────────┴─────────────────┴───────────────────────┤
│                      Core Services Layer                            │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │  Role Matching   │  │  Data Fetching   │                        │
│  │  Engine          │  │  Orchestrator    │                        │
│  └────────┬─────────┘  └────────┬─────────┘                        │
│           │                     │                                   │
│  ┌────────▼─────────┐  ┌───────▼──────────┐                        │
│  │  Insights        │  │  Background Job  │                        │
│  │  Aggregation     │  │  (QStash/Inngest)│                        │
│  └────────┬─────────┘  └───────┬──────────┘                        │
│           │                     │                                   │
├───────────┴─────────────────────┴───────────────────────────────────┤
│                      Data Layer                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Turso (SQL)  │  │ Upstash      │  │ External     │              │
│  │ Persistent   │  │ Redis        │  │ Data APIs    │              │
│  │ Storage      │  │ (Cache)      │  │ (ScrapIn/    │              │
│  │              │  │              │  │  Bright Data)│              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Search Form | Accept role + company input, validate, submit query | React Server Component with client form |
| Results Dashboard | Display destination companies, counts, role breakdowns | Server-rendered with streaming |
| Insights Analytics | Surface patterns ("people like you tend to...") | Server-computed aggregations |
| Role Matching Engine | Normalize and fuzzy-match job titles across variations | Fuse.js with pre-normalization pipeline |
| Data Fetching Orchestrator | Decide cache-hit vs live-fetch, coordinate external API calls | Server Action that checks Redis, then Turso, then dispatches fetch |
| Background Job Queue | Run long-running data fetches outside request lifecycle | Upstash QStash or Inngest functions triggered by search events |
| Insights Aggregation | Compute statistical patterns from accumulated migration data | SQL queries via Drizzle ORM |
| Turso Database | Persistent storage for searches, migrations, users | libSQL via Drizzle ORM |
| Upstash Redis | Hot cache for repeat queries, rate limiting | HTTP-based Redis via @upstash/redis |
| External Data APIs | Source career transition data from professional networks | ScrapIn (primary), Bright Data (fallback) via provider adapter |

## Recommended Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Unauthenticated routes
│   │   ├── page.tsx        # Landing page + search form
│   │   └── results/[id]/   # Results dashboard (dynamic route)
│   ├── (auth)/             # Auth routes
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/        # Authenticated routes
│   │   ├── saved/          # Saved searches
│   │   └── settings/       # Account settings
│   ├── api/
│   │   ├── auth/[...all]/  # Better Auth handler
│   │   └── webhooks/       # Background job webhooks (QStash/Inngest)
│   └── layout.tsx
├── lib/
│   ├── db/                 # Database layer
│   │   ├── schema.ts       # Drizzle schema definitions
│   │   ├── client.ts       # Turso connection
│   │   └── queries/        # Typed query functions
│   ├── cache/              # Caching layer
│   │   ├── client.ts       # Upstash Redis connection
│   │   └── keys.ts         # Cache key generation + normalization
│   ├── matching/           # Role matching engine
│   │   ├── normalize.ts    # Title normalization (abbreviations, synonyms)
│   │   ├── fuzzy.ts        # Fuse.js configuration + matching
│   │   └── synonyms.ts     # Hand-curated synonym dictionary
│   ├── data/               # External data fetching
│   │   ├── providers/      # API adapters (scrapin.ts, brightdata.ts)
│   │   ├── types.ts        # Provider interface contract
│   │   ├── fetcher.ts      # Unified fetch interface
│   │   └── transform.ts    # Normalize external data to internal schema
│   ├── insights/           # Analytics/pattern computation
│   │   └── aggregations.ts # SQL-based aggregations
│   └── auth.ts             # Better Auth configuration
├── actions/                # Server Actions
│   ├── search.ts           # Search initiation + cache check
│   └── saved.ts            # Saved search CRUD
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── search/             # Search form components
│   ├── results/            # Results display components
│   └── charts/             # Recharts wrapper components
└── types/                  # Shared TypeScript types
    ├── migration.ts        # Core domain types
    └── api.ts              # API request/response types
```

### Structure Rationale

- **`lib/matching/`:** Isolated because the matching engine is the core differentiator. It will evolve independently (string matching first, potentially embeddings later) and needs to be testable in isolation.
- **`lib/data/providers/`:** Provider pattern because the external data source WILL change. LinkedIn data APIs are volatile. Abstracting behind an interface means swapping ScrapIn for Bright Data or another provider is a config change, not a rewrite.
- **`lib/cache/`:** Separated from DB because Redis serves a fundamentally different purpose (hot path speed) than Turso (persistent storage, queries). They have different TTL strategies, different data shapes.
- **`actions/`:** Server Actions over API routes for most mutations. Simpler, type-safe, no fetch boilerplate.

## Architectural Patterns

### Pattern 1: Cache-Aside with Dual Storage

**What:** Check Redis first (fast), fall back to Turso (persistent), then fetch from external API (slow). Store results in both layers.

**When to use:** Every search query. This is the core interaction pattern.

**Trade-offs:**
- Pro: Repeat queries are instant (< 100ms from Redis)
- Pro: Data survives Redis TTL expiry (Turso has it permanently)
- Pro: External API calls are minimized (cost savings)
- Con: Three layers to reason about
- Con: Cache invalidation needs thought

```typescript
async function searchMigrations(role: string, company: string) {
  const cacheKey = buildCacheKey(normalize(role), normalize(company));

  // Layer 1: Redis (fastest, 30-day TTL)
  const cached = await redis.get<MigrationResult>(cacheKey);
  if (cached) return { data: cached, source: 'cache' };

  // Layer 2: Turso (persistent, may be older)
  const stored = await db.query.searches.findFirst({
    where: eq(searches.cacheKey, cacheKey),
  });
  if (stored && !isStale(stored.fetchedAt, 30)) {
    await redis.set(cacheKey, stored.data, { ex: 60 * 60 * 24 * 30 });
    return { data: stored.data, source: 'db' };
  }

  // Layer 3: External API (slow, costs money)
  const raw = await dataProvider.searchFormerEmployees(company, role);
  const processed = transformAndAggregate(raw);

  await Promise.all([
    db.insert(searches).values({ cacheKey, data: processed, fetchedAt: new Date() }),
    redis.set(cacheKey, processed, { ex: 60 * 60 * 24 * 30 }),
  ]);

  return { data: processed, source: 'api' };
}
```

### Pattern 2: Provider Adapter Pattern

**What:** Abstract external data APIs behind a common interface so you can swap providers without touching business logic.

**When to use:** All external data fetching. Non-negotiable given LinkedIn data access volatility.

```typescript
// lib/data/types.ts
interface DataProvider {
  name: string;
  searchFormerEmployees(company: string, role: string): Promise<RawProfile[]>;
  healthCheck(): Promise<boolean>;
}

// lib/data/providers/scrapin.ts
export const scrapinProvider: DataProvider = {
  name: 'scrapin',
  async searchFormerEmployees(company, role) {
    const response = await fetch('https://api.scrapin.io/...', { ... });
    return transformScrapinResponse(await response.json());
  },
  async healthCheck() { /* ... */ },
};

// lib/data/fetcher.ts -- provider selection with fallback
export async function fetchMigrationData(company: string, role: string) {
  const primary = getProvider(env.PRIMARY_DATA_PROVIDER); // scrapin
  const fallback = getProvider(env.FALLBACK_DATA_PROVIDER); // brightdata

  try {
    return await primary.searchFormerEmployees(company, role);
  } catch (err) {
    console.error(`Primary provider ${primary.name} failed`, err);
    return await fallback.searchFormerEmployees(company, role);
  }
}
```

### Pattern 3: Two-Tier Role Matching

**What:** Fast string normalization for common cases (abbreviations, known synonyms), followed by Fuse.js fuzzy matching for harder cases.

**When to use:** Every query where role titles need comparison.

**Build order:** Ship with both tiers from the start -- Fuse.js is lightweight enough that there's no reason to skip it.

```typescript
// lib/matching/normalize.ts
const ABBREVIATIONS: Record<string, string> = {
  'sr': 'senior', 'jr': 'junior', 'mgr': 'manager',
  'eng': 'engineer', 'dir': 'director', 'vp': 'vice president',
};

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .map(word => ABBREVIATIONS[word] || word)
    .join(' ')
    .trim();
}

// lib/matching/fuzzy.ts
import Fuse from 'fuse.js';

const fuse = new Fuse([], {
  keys: ['normalizedTitle'],
  threshold: 0.4,
  ignoreFieldNorm: true,
  includeScore: true,
});

export function findMatchingRoles(query: string, candidates: Role[]): Role[] {
  fuse.setCollection(candidates.map(c => ({
    ...c,
    normalizedTitle: normalizeTitle(c.title),
  })));
  return fuse.search(normalizeTitle(query))
    .filter(r => (r.score ?? 1) < 0.4)
    .map(r => r.item);
}
```

## Data Model

```sql
-- Search queries and their cached results
CREATE TABLE searches (
  id TEXT PRIMARY KEY,
  role_query TEXT NOT NULL,          -- original user input
  company_query TEXT NOT NULL,       -- original user input
  normalized_role TEXT NOT NULL,     -- normalized for matching
  normalized_company TEXT NOT NULL,  -- normalized for cache key
  cache_key TEXT UNIQUE NOT NULL,    -- deterministic key for Redis
  status TEXT DEFAULT 'processing',  -- processing | ready | failed
  result_count INTEGER DEFAULT 0,
  fetched_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Aggregated migration destinations (anonymized)
CREATE TABLE migrations (
  id TEXT PRIMARY KEY,
  search_id TEXT NOT NULL REFERENCES searches(id),
  destination_company TEXT NOT NULL,
  destination_role TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(search_id, destination_company, destination_role)
);

-- User saved searches
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  search_id TEXT NOT NULL REFERENCES searches(id),
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(user_id, search_id)
);

-- Better Auth manages its own tables (user, session, account, verification)
```

## Anti-Patterns

### Anti-Pattern 1: Synchronous External API Calls in Request Handlers

**What people do:** Call ScrapIn directly in a Server Action and make the user wait.
**Why it's wrong:** External API calls take 5-30+ seconds. Vercel free tier has 10-second timeout.
**Do this instead:** For MVP, use Vercel Pro (60s timeout) and show progress. For scale, dispatch to background jobs (Upstash QStash or Inngest).

### Anti-Pattern 2: Storing Individual Identity Data

**What people do:** Save names, LinkedIn URLs, profile photos in the database.
**Why it's wrong:** Privacy liability, GDPR risk, and it's not what users need. Users want patterns, not individuals.
**Do this instead:** Aggregate on receipt. Store "5 people moved from Role A at Company X to Role B at Company Y." Discard individual details.

### Anti-Pattern 3: Single Data Provider with No Abstraction

**What people do:** Call ScrapIn directly everywhere in the codebase.
**Why it's wrong:** If ScrapIn goes down (like Proxycurl did), your entire product is dead.
**Do this instead:** Provider adapter pattern. One interface, multiple implementations. Swap in a day, not a month.

### Anti-Pattern 4: Raw External Data in Database

**What people do:** Dump the raw JSON from ScrapIn into a column.
**Why it's wrong:** Every provider returns different schemas. Switching providers means migrating data. Analytics become impossible.
**Do this instead:** Transform to your internal schema immediately on receipt.

## Background Job Strategy

For MVP, start simple:

1. **Vercel Pro tier** ($20/mo) gives 60-second function timeout -- enough for most ScrapIn API calls
2. If a single request isn't enough time, use **Upstash QStash** (free tier: 500 messages/day) to dispatch background work
3. Scale to **Inngest** (free tier: 5K events/month) only if you need complex job orchestration (retries, fan-out, scheduling)

The client polls for completion:
```typescript
// Client-side polling
function useSearchResults(searchId: string) {
  return useSWR(`/api/search/${searchId}/status`, fetcher, {
    refreshInterval: (data) => data?.status === 'ready' ? 0 : 3000,
  });
}
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1K users | Monolith is fine. Single Turso DB, Upstash Redis free tier, ScrapIn pay-per-use. Main bottleneck is API cost. |
| 1K-10K users | Cache hit rate increases (popular companies searched repeatedly). Add composite index on `(normalized_company, normalized_role)`. Upstash Redis ~$10/mo. |
| 10K-100K users | External API costs are primary concern. Implement rate limiting (Upstash rate limiter). Consider pre-fetching popular combos. May need Turso embedded replicas. |

## Sources

- [Turso + Next.js guide](https://docs.turso.tech/sdk/ts/guides/nextjs)
- [Turso Vercel Marketplace](https://vercel.com/marketplace/tursocloud)
- [Upstash Redis + Next.js](https://upstash.com/blog/nextjs-caching-with-redis)
- [Upstash QStash](https://upstash.com/docs/qstash/overall/getstarted)
- [Inngest for Vercel](https://vercel.com/marketplace/inngest)
- [ScrapIn API](https://www.scrapin.io/)
- [Bright Data LinkedIn API](https://docs.brightdata.com/api-reference/web-scraper-api/social-media-apis/linkedin)
- [Fuse.js Documentation](https://www.fusejs.io/)

---
*Architecture research for: Career migration intelligence platform (Leavers)*
*Researched: 2026-03-06*
