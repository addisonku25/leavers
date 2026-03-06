# Phase 1: Foundation & Data Pipeline - Research

**Researched:** 2026-03-06
**Domain:** Next.js full-stack app with external API data sourcing, fuzzy matching, and multi-tier caching
**Confidence:** MEDIUM (ScrapIn API capabilities are unverified; all other areas HIGH)

## Summary

This phase builds a greenfield Next.js 15 application that lets users search by company and role, fetches career migration data from ScrapIn (or fallback), fuzzy-matches role titles with Fuse.js, caches results in Redis (hot) and Turso/SQLite (persistent), and displays a search form with loading states and a results page. The biggest technical risk is whether ScrapIn's API can actually answer "where did former employees of company X with role Y go?" -- the API documentation is gated behind signup, and public previews don't confirm a "past company" filter or role-title search parameter. This MUST be validated before building any UI.

The stack is fully decided: Next.js 15, React 19, TypeScript, Turso + Drizzle ORM, Upstash Redis, ScrapIn, Fuse.js, shadcn/ui, Tailwind CSS 4, Zod 4, React Hook Form, and Biome. Architecture follows cache-aside pattern (Redis -> Turso -> API) with a provider adapter pattern for data source swappability.

**Primary recommendation:** Validate ScrapIn API capabilities first (Wave 0), then scaffold the project and build the data pipeline with provider abstraction, then build the search UI. The provider adapter pattern is critical because ScrapIn may not work and fallback to Bright Data or mock data is explicitly planned.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hero + search landing page: value prop headline, brief description, then search form below
- Two text inputs (company + role) with dropdown suggestions as user types
- Seed suggestions with ~100-200 popular companies and common role titles; grow from past searches over time
- Search navigates to dedicated results page at `/results/[id]` -- each search gets unique URL
- Step-by-step progress indicators during live API fetch with named steps that check off
- Include time expectation message: "This may take 10-20 seconds on first search"
- After 15 seconds show "Taking longer than usual..." but keep waiting up to 60s
- Cached results show brief shimmer/skeleton (~500ms) before displaying
- Do NOT show cache age or "results from X days ago" to users
- Validate ScrapIn API FIRST before building any UI -- test script with real company/role
- Waterfall fallback: ScrapIn -> Bright Data -> mock/demo data
- Sign up for ScrapIn pay-per-use and run validation test
- If no paid API works, build with curated demo data to validate product concept
- Empty results: helpful guidance with suggestions + "Try Another Search" button
- API failure: honest error message with retry button -- no silent retry
- Low result counts (2-3 matches): show normally
- Form validation: inline, both fields required, show error inline if empty on submit

### Claude's Discretion
- Exact hero section copy and visual design
- Loading step names and animation style
- Suggestion dropdown UI implementation details
- Seed company/role list curation approach
- Form field placeholder text and microcopy
- Error message exact wording

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | User can search by company name and role title | Search form with two inputs, server action to process query, Zod validation |
| DATA-02 | App fuzzy-matches role titles across abbreviations, synonyms, seniority | Fuse.js with synonym table + two-tier matching (exact then fuzzy) |
| DATA-03 | App fetches career migration data on-demand from external APIs | ScrapIn Person Search API (or fallback), provider adapter pattern |
| DATA-04 | Results cached with 30-day TTL, repeat queries instant | Upstash Redis (hot, 24h TTL) + Turso (persistent, 30-day TTL), cache-aside pattern |
| DATA-05 | Data provider abstracted behind interface for swappability | TypeScript interface + adapter pattern in `lib/data/providers/` |
| SRCH-01 | User sees search form with company and role input fields | shadcn/ui Input + Command/Combobox components, React Hook Form + Zod |
| SRCH-04 | User sees loading/processing state during on-demand fetch | Step-by-step progress UI with named stages, streaming or polling pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | Full-stack React framework | App Router, Server Actions, built-in API routes |
| React | 19.x | UI library | Latest with ref-as-prop, useActionState |
| TypeScript | 5.x | Type safety | Required by stack decision |
| Turso + @libsql/client | latest | Persistent database (SQLite-compatible) | Serverless, edge-ready, free tier generous |
| Drizzle ORM | latest | Type-safe SQL ORM | Lightweight, SQLite/Turso native support |
| Upstash Redis (@upstash/redis) | latest | Hot cache layer | HTTP-based, serverless, no connection pooling needed |
| Fuse.js | 7.x | Client/server-side fuzzy search | Lightweight, configurable threshold/weighting |
| shadcn/ui | latest | Component library | Copies source into project, full ownership |
| Tailwind CSS | 4.x | Utility-first CSS | CSS-first config (no tailwind.config.js), faster builds |
| Zod | 4.x | Schema validation | 14x faster parsing, smaller bundle, shared client/server schemas |
| React Hook Form | 7.x | Form state management | Minimal re-renders, zodResolver integration |
| Biome | latest | Linter + formatter | Single tool replaces ESLint + Prettier, 10-25x faster |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @hookform/resolvers | latest | Zod resolver for RHF | Form validation with zodResolver |
| drizzle-kit | latest | Migration CLI | Dev dependency for schema push/generate |
| @tailwindcss/vite | latest | Tailwind Vite plugin | If using Turbopack/Vite; otherwise @tailwindcss/postcss |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ScrapIn | Bright Data LinkedIn Profiles Dataset ($250/100K records) | Bulk dataset vs real-time API; better for pre-seeding but not on-demand |
| ScrapIn | Proxycurl | Was shutting down (LinkedIn lawsuit Jan 2025); not recommended |
| Fuse.js | MiniSearch | Fuse.js is more widely used and has simpler API for this use case |
| Upstash Redis | Vercel KV | Vercel KV is built on Upstash anyway; using Upstash directly avoids vendor lock-in |

**Installation:**
```bash
# Create project
npx create-next-app@latest leavers --typescript --tailwind --app --src-dir --import-alias "@/*"

# Core dependencies
npm install @libsql/client drizzle-orm @upstash/redis fuse.js zod react-hook-form @hookform/resolvers

# Dev dependencies
npm install -D drizzle-kit @biomejs/biome

# shadcn/ui init (after project creation)
npx shadcn@latest init

# shadcn/ui components needed for Phase 1
npx shadcn@latest add button input command skeleton card
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page (hero + search)
│   ├── results/
│   │   └── [id]/
│   │       ├── page.tsx        # Results page
│   │       └── loading.tsx     # Streaming loading state
│   └── api/                    # API routes if needed
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── search-form.tsx         # Search form with suggestions
│   ├── search-progress.tsx     # Step-by-step loading indicator
│   └── search-suggestions.tsx  # Autocomplete dropdown
├── lib/
│   ├── db/
│   │   ├── index.ts            # Drizzle client initialization
│   │   ├── schema.ts           # Drizzle table definitions
│   │   └── migrations/         # Generated migrations
│   ├── cache/
│   │   ├── redis.ts            # Upstash Redis client
│   │   └── cache-manager.ts    # Cache-aside orchestration
│   ├── data/
│   │   ├── types.ts            # Provider interface + shared types
│   │   └── providers/
│   │       ├── scrapin.ts      # ScrapIn adapter
│   │       ├── brightdata.ts   # Bright Data adapter (fallback)
│   │       └── mock.ts         # Mock/demo data adapter
│   ├── matching/
│   │   ├── fuzzy.ts            # Fuse.js configuration
│   │   └── synonyms.ts         # Role title synonym table
│   └── validations/
│       └── search.ts           # Zod schemas (shared client/server)
├── actions/
│   └── search.ts               # Server action for search
└── data/
    ├── companies.json          # Seed company suggestions
    └── roles.json              # Seed role title suggestions
```

### Pattern 1: Provider Adapter Pattern (DATA-05)
**What:** Abstract data source behind a TypeScript interface so ScrapIn, Bright Data, or mock data can be swapped via config
**When to use:** Always -- this is a locked decision
**Example:**
```typescript
// lib/data/types.ts
export interface CareerMigration {
  sourceCompany: string;
  sourceRole: string;
  destinationCompany: string;
  destinationRole: string;
  count: number;
}

export interface MigrationSearchParams {
  company: string;
  role: string;
}

export interface DataProvider {
  name: string;
  search(params: MigrationSearchParams): Promise<CareerMigration[]>;
  healthCheck(): Promise<boolean>;
}

// lib/data/providers/scrapin.ts
export class ScrapInProvider implements DataProvider {
  name = "scrapin";
  async search(params: MigrationSearchParams): Promise<CareerMigration[]> {
    // 1. Search for people at company with role (Person Search endpoint)
    // 2. For each person, get their career history (Person Profile endpoint)
    // 3. Find where they went AFTER the source company
    // 4. Aggregate into CareerMigration[]
    // This is a multi-step process -- each person requires a separate API call
  }
  async healthCheck(): Promise<boolean> { /* ping API */ }
}

// lib/data/providers/mock.ts
export class MockProvider implements DataProvider {
  name = "mock";
  async search(params: MigrationSearchParams): Promise<CareerMigration[]> {
    // Return curated demo data
  }
  async healthCheck(): Promise<boolean> { return true; }
}
```

### Pattern 2: Cache-Aside with Two Tiers (DATA-04)
**What:** Check Redis first (hot cache, 24h TTL), then Turso (persistent, 30-day TTL), then fetch from API
**When to use:** Every search query
**Example:**
```typescript
// lib/cache/cache-manager.ts
export async function getCachedOrFetch(
  params: MigrationSearchParams,
  provider: DataProvider
): Promise<CareerMigration[]> {
  const cacheKey = buildCacheKey(params); // normalized: "company:role" lowercase

  // Tier 1: Redis hot cache
  const redisResult = await redis.get<CareerMigration[]>(cacheKey);
  if (redisResult) return redisResult;

  // Tier 2: Turso persistent cache
  const tursoResult = await db.select().from(searches)
    .where(and(eq(searches.cacheKey, cacheKey), gt(searches.expiresAt, new Date())));
  if (tursoResult.length > 0) {
    const migrations = await db.select().from(migrationsTable)
      .where(eq(migrationsTable.searchId, tursoResult[0].id));
    // Repopulate Redis
    await redis.set(cacheKey, migrations, { ex: 86400 }); // 24h
    return migrations;
  }

  // Tier 3: Live API fetch
  const results = await provider.search(params);
  // Store in both caches
  await storeInTurso(cacheKey, params, results);
  await redis.set(cacheKey, results, { ex: 86400 });
  return results;
}
```

### Pattern 3: Server Action with Streaming Progress (SRCH-04)
**What:** Use Next.js Server Actions for search submission, with progress updates
**When to use:** Search form submission
**Example:**
```typescript
// actions/search.ts
"use server";
import { searchSchema } from "@/lib/validations/search";

export async function searchAction(formData: FormData) {
  const parsed = searchSchema.safeParse({
    company: formData.get("company"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  // Create search record, get ID
  const searchId = await createSearchRecord(parsed.data);

  // Redirect to results page (which handles fetching + loading states)
  redirect(`/results/${searchId}`);
}
```

### Pattern 4: Shared Zod Schemas (client + server validation)
**What:** Define Zod schemas once, use for both React Hook Form client validation and server action validation
**When to use:** All form inputs
**Example:**
```typescript
// lib/validations/search.ts
import { z } from "zod";

export const searchSchema = z.object({
  company: z.string().min(1, "Company name is required").max(100),
  role: z.string().min(1, "Role title is required").max(100),
});

export type SearchInput = z.infer<typeof searchSchema>;
```

### Anti-Patterns to Avoid
- **Putting business logic in API routes:** Use Server Actions for mutations/searches; API routes only if external webhooks need them
- **Direct database calls in components:** Always go through cache manager, never bypass the cache layer
- **Tight coupling to ScrapIn:** Never import ScrapIn-specific types outside the provider adapter; always use the shared `CareerMigration` type
- **Storing individual profile data:** Only store aggregated/anonymized migration counts, never individual names or LinkedIn URLs

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching | Custom Levenshtein/edit-distance | Fuse.js | Handles scoring, weighting, thresholds; tested at scale |
| Form state + validation | Manual onChange handlers + validation | React Hook Form + Zod | Re-render optimization, error handling, focus management |
| UI components | Custom input, button, skeleton | shadcn/ui | Accessible, styled, well-tested; copy source for full control |
| Redis client for serverless | Raw Redis protocol over HTTP | @upstash/redis | Handles REST-based connection, no TCP needed in serverless |
| ORM / query builder | Raw SQL strings | Drizzle ORM | Type-safe queries, migration management, SQLite/Turso native |
| Code formatting + linting | ESLint + Prettier config | Biome | Single config, 10-25x faster, fewer dependencies |
| Cache key normalization | Manual string concatenation | Deterministic hash function | Prevents cache misses from whitespace/casing differences |

**Key insight:** This stack was explicitly chosen to avoid hand-rolling. Every library listed solves a deceptively complex problem (fuzzy matching edge cases, serverless Redis connection pooling, form accessibility, etc.).

## Common Pitfalls

### Pitfall 1: ScrapIn API Can't Answer the Core Question
**What goes wrong:** ScrapIn may only support profile enrichment (look up a known person), not discovery (find all people who left company X with role Y). The API docs are gated; public previews don't confirm "past company" as a search filter.
**Why it happens:** Most LinkedIn data APIs are designed for sales/recruiting (find current employees), not career migration analysis (find former employees and where they went).
**How to avoid:** Validate FIRST. Write a test script that: (1) Calls Person Search with a company name + role, (2) Checks if results include people who LEFT the company, (3) Checks if career history shows their next company. If this doesn't work, immediately pivot to Bright Data or mock data.
**Warning signs:** API returns only current employees, no "past company" filter, career history doesn't show post-departure jobs.

### Pitfall 2: N+1 API Call Problem
**What goes wrong:** If ScrapIn requires one API call per person to get career history, searching a company with 50 matches = 50 API calls = slow + expensive.
**Why it happens:** Person Search returns a list; Person Profile returns career history. These are separate endpoints.
**How to avoid:** (1) Limit results per search (e.g., top 20-50 profiles), (2) Parallelize API calls with Promise.allSettled, (3) Cache aggressively so this cost is only paid once per company+role pair, (4) Consider Bright Data bulk dataset for popular companies.
**Warning signs:** Search takes 30+ seconds, API costs spike.

### Pitfall 3: Vercel Function Timeout
**What goes wrong:** Free tier has 10s timeout; even Pro has 60s. Live API fetch with multiple ScrapIn calls could exceed this.
**Why it happens:** On-demand data fetching from external APIs is inherently slow.
**How to avoid:** Use Vercel Pro (60s limit, already acknowledged in STATE.md). If still too slow, consider: (1) Return search ID immediately, fetch in background, poll for results, or (2) Use Vercel's streaming to keep connection alive. The CONTEXT.md specifies waiting up to 60s with progress updates.
**Warning signs:** 504 Gateway Timeout errors on first searches.

### Pitfall 4: Tailwind CSS v4 Breaking Changes
**What goes wrong:** Using v3 syntax in a v4 project (bg-gradient-to-r instead of bg-linear-to-r, expecting default gray borders, using tailwind.config.js).
**Why it happens:** Most tutorials and AI training data use v3 syntax.
**How to avoid:** Use CSS-first configuration with @theme directive and @import "tailwindcss". No tailwind.config.js. Use `bg-linear-to-*` for gradients. Border utilities use currentColor by default now.
**Warning signs:** Missing styles, config not being picked up, gradient classes not working.

### Pitfall 5: Zod 4 Breaking Changes from Zod 3
**What goes wrong:** Using deprecated Zod 3 patterns like invalid_type_error/required_error params, or .pick()/.omit() on refined schemas.
**Why it happens:** Most examples online still show Zod 3 patterns.
**How to avoid:** Use Zod 4 API. The error message customization API changed. Import from "zod" (v4 is the default now). Consider @zod/mini for client-side only validation if bundle size matters.
**Warning signs:** TypeScript errors on schema definitions, runtime errors on .pick()/.omit().

### Pitfall 6: Suggestion Dropdown Performance
**What goes wrong:** Filtering 200 companies + roles on every keystroke causes jank.
**Why it happens:** Unoptimized filtering or re-rendering.
**How to avoid:** Use shadcn/ui Command component (built on cmdk), which handles virtualization and filtering efficiently. Debounce input (200-300ms). Keep suggestion lists small (show top 8-10 matches).
**Warning signs:** Lag when typing in search fields.

### Pitfall 7: Cache Key Collision / Miss
**What goes wrong:** Same search produces different cache keys due to casing, whitespace, or special characters.
**Why it happens:** "Google" vs "google" vs " Google " generate different keys.
**How to avoid:** Normalize cache keys: lowercase, trim, collapse whitespace. Use a deterministic approach: `${company.toLowerCase().trim()}:${role.toLowerCase().trim()}`.
**Warning signs:** Same search hits API twice, cache never seems to work.

## Code Examples

### Drizzle Schema for Searches + Migrations
```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const searches = sqliteTable("searches", {
  id: text("id").primaryKey(), // nanoid or uuid
  company: text("company").notNull(),
  role: text("role").notNull(),
  cacheKey: text("cache_key").notNull().unique(),
  provider: text("provider").notNull(), // "scrapin" | "brightdata" | "mock"
  resultCount: integer("result_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const migrations = sqliteTable("migrations", {
  id: text("id").primaryKey(),
  searchId: text("search_id").notNull().references(() => searches.id),
  destinationCompany: text("destination_company").notNull(),
  destinationRole: text("destination_role").notNull(),
  count: integer("count").notNull().default(1),
});
```

### Upstash Redis Client
```typescript
// lib/cache/redis.ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

### Turso/Drizzle Client
```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

### Fuse.js Role Matching Configuration
```typescript
// lib/matching/fuzzy.ts
import Fuse from "fuse.js";
import { ROLE_SYNONYMS } from "./synonyms";

interface RoleEntry {
  title: string;
  synonyms: string[];
}

// Expand roles with synonyms for better matching
const roleEntries: RoleEntry[] = Object.entries(ROLE_SYNONYMS).map(
  ([title, synonyms]) => ({ title, synonyms })
);

const fuse = new Fuse(roleEntries, {
  keys: [
    { name: "title", weight: 2 },
    { name: "synonyms", weight: 1 },
  ],
  threshold: 0.4, // 0 = exact, 1 = match anything
  includeScore: true,
  ignoreLocation: true, // Don't penalize matches at end of string
});

export function matchRole(query: string): string[] {
  const results = fuse.search(query);
  return results
    .filter((r) => (r.score ?? 1) < 0.5)
    .map((r) => r.item.title);
}
```

### Role Synonym Table
```typescript
// lib/matching/synonyms.ts
export const ROLE_SYNONYMS: Record<string, string[]> = {
  "Solutions Engineer": ["Solution Engineer", "SE", "Sales Engineer", "Pre-Sales Engineer", "Technical Solutions Engineer"],
  "Software Engineer": ["SWE", "Software Developer", "Developer", "Programmer", "Software Dev"],
  "Product Manager": ["PM", "Product Owner", "PO", "Product Lead"],
  "Data Scientist": ["Data Science", "DS", "ML Engineer", "Machine Learning Engineer"],
  "Account Executive": ["AE", "Sales Rep", "Sales Representative", "Account Manager"],
  // ... expand with 50-100 common roles
};
```

### Search Form with React Hook Form + Zod
```typescript
// components/search-form.tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchSchema, type SearchInput } from "@/lib/validations/search";
import { searchAction } from "@/actions/search";

export function SearchForm() {
  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: { company: "", role: "" },
  });

  async function onSubmit(data: SearchInput) {
    const formData = new FormData();
    formData.set("company", data.company);
    formData.set("role", data.role);
    await searchAction(formData);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Company input with suggestions dropdown */}
      {/* Role input with suggestions dropdown */}
      {/* Submit button */}
    </form>
  );
}
```

### Biome Configuration
```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": { "recommended": true }
  },
  "organizeImports": { "enabled": true },
  "files": {
    "ignore": ["node_modules", ".next", "dist", "build"]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js (JS config) | @theme in CSS + @import "tailwindcss" | Tailwind v4 (Jan 2025) | No config file needed; content detection is automatic |
| ESLint + Prettier (2 tools, 100+ deps) | Biome (1 tool, 1 binary) | Biome 1.x stable (2024) | 10-25x faster, single config file |
| Zod 3 method chaining | Zod 4 (same API, faster + smaller) | Zod 4 (mid-2025) | 14x faster parsing, 57% smaller bundle |
| React.forwardRef for component refs | ref as regular prop | React 19 (2024) | Simpler component APIs |
| useFormState (Next.js 14) | useActionState (React 19) | React 19 | Renamed hook, same concept |
| bg-gradient-to-r | bg-linear-to-r | Tailwind v4 | Must update gradient utility names |
| Proxycurl for LinkedIn data | ScrapIn / Bright Data | Proxycurl shutdown (2025) | Proxycurl no longer viable |

**Deprecated/outdated:**
- Proxycurl: LinkedIn filed lawsuit Jan 2025; service shutting down. Do not use.
- tailwind.config.js: Still works in v4 via @config directive but CSS-first is the new standard
- @tailwind directives: Replaced by @import "tailwindcss" in v4
- Zod invalid_type_error/required_error params: Dropped in Zod 4

## Open Questions

1. **Can ScrapIn answer "where did people go?"**
   - What we know: ScrapIn has Person Search (by name, company, domain, email) and Person Profile (returns career history with past roles/companies/dates). It does NOT clearly have a "past company" filter.
   - What's unclear: Can you search for people by company AND get those who LEFT (not just current employees)? Is there a keyword or filter for "past" vs "current" employer? What's the actual cost per search (pricing starts at $500 for credits, $30 for trial)?
   - Recommendation: Sign up for the $30 7-day trial. Write a validation script. Test with a well-known company (e.g., "Google", role "Solutions Engineer"). If it only returns current employees, the API cannot answer the core question.

2. **Multi-step API call cost and latency**
   - What we know: If ScrapIn works, the workflow is: Person Search (list people) -> Person Profile (per-person career history). This is N+1 calls.
   - What's unclear: How many results does Person Search return? What's the rate limit? Can we parallelize calls?
   - Recommendation: During validation, measure: (1) results count for a real search, (2) time per Person Profile call, (3) total time for a typical search. This determines whether 60s Vercel Pro timeout is sufficient.

3. **Bright Data as fallback**
   - What we know: Bright Data offers LinkedIn Profiles Dataset ($250/100K records) with 620M+ profiles including career history. Supports custom dataset requests.
   - What's unclear: Can you get a subset filtered by company? How fresh is the data? What's the delivery format and latency?
   - Recommendation: If ScrapIn fails, investigate Bright Data's custom dataset option for popular companies. This shifts the model from on-demand to pre-seeded.

4. **Progress indicator implementation**
   - What we know: User wants step-by-step progress (like flight search). Named steps that check off.
   - What's unclear: Server Actions don't natively stream progress updates. Options: (1) Server-Sent Events from API route, (2) Poll a status endpoint, (3) Optimistic client-side timed steps.
   - Recommendation: Use optimistic client-side timed progress for v1. Show steps on a timer that approximates the actual process. The actual data fetch happens in background; when it completes, show results. This avoids complex streaming infrastructure while still feeling responsive.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (standard for Next.js + Vite/Turbopack projects) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Search action accepts company + role and returns results | unit | `npx vitest run src/lib/__tests__/search-action.test.ts -t "search action"` | No -- Wave 0 |
| DATA-02 | Fuzzy matcher maps "Sr. SE" to "Solutions Engineer" | unit | `npx vitest run src/lib/__tests__/fuzzy-matching.test.ts -t "role matching"` | No -- Wave 0 |
| DATA-03 | Provider returns career migration data for valid input | integration | `npx vitest run src/lib/__tests__/provider.test.ts -t "data provider"` | No -- Wave 0 |
| DATA-04 | Cache-aside returns cached result on repeat query | unit | `npx vitest run src/lib/__tests__/cache-manager.test.ts -t "cache"` | No -- Wave 0 |
| DATA-05 | Mock provider satisfies DataProvider interface | unit | `npx vitest run src/lib/__tests__/provider.test.ts -t "interface"` | No -- Wave 0 |
| SRCH-01 | Search form renders with company and role inputs | unit | `npx vitest run src/components/__tests__/search-form.test.tsx -t "search form"` | No -- Wave 0 |
| SRCH-04 | Progress component shows loading steps | unit | `npx vitest run src/components/__tests__/search-progress.test.tsx -t "progress"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with React/JSX support
- [ ] `src/lib/__tests__/fuzzy-matching.test.ts` -- covers DATA-02
- [ ] `src/lib/__tests__/cache-manager.test.ts` -- covers DATA-04
- [ ] `src/lib/__tests__/provider.test.ts` -- covers DATA-03, DATA-05
- [ ] `src/lib/__tests__/search-action.test.ts` -- covers DATA-01
- [ ] `src/components/__tests__/search-form.test.tsx` -- covers SRCH-01
- [ ] `src/components/__tests__/search-progress.test.tsx` -- covers SRCH-04
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`

## Sources

### Primary (HIGH confidence)
- [Next.js official docs](https://nextjs.org/docs/app) -- App Router, Server Actions, project structure
- [Drizzle ORM docs](https://orm.drizzle.team/docs/tutorials/drizzle-with-turso) -- Turso integration, SQLite schema
- [Turso docs](https://docs.turso.tech/sdk/ts/orm/drizzle) -- Drizzle setup, @libsql/client
- [Upstash Redis docs](https://upstash.com/docs/redis/tutorials/nextjs_with_redis) -- Next.js integration
- [Fuse.js docs](https://www.fusejs.io/api/options.html) -- Configuration options, threshold, weighting
- [shadcn/ui docs](https://ui.shadcn.com/docs/installation/next) -- Next.js 15 + React 19 setup
- [Tailwind CSS v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) -- Breaking changes from v3
- [Zod v4 release notes](https://zod.dev/v4) -- Breaking changes, new features
- [Biome docs](https://biomejs.dev) -- Configuration, Next.js setup

### Secondary (MEDIUM confidence)
- [ScrapIn documentation preview](https://documentation.scrapin.io/api) -- Endpoint overview (full docs gated)
- [ScrapIn pricing](https://www.scrapin.io/pricing) -- $30 trial, $500+ pay-as-you-go
- [Bright Data LinkedIn datasets](https://brightdata.com/products/datasets/linkedin) -- $250/100K records, 620M+ profiles

### Tertiary (LOW confidence)
- ScrapIn's ability to search by past company and return career transitions -- not verified in public docs
- Bright Data custom dataset filtering by company -- needs direct inquiry
- Exact ScrapIn credit costs per API call -- not publicly documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries explicitly decided in CONTEXT.md, versions verified
- Architecture: HIGH -- cache-aside + provider adapter patterns are well-documented
- Pitfalls: HIGH -- Tailwind v4, Zod 4, and timeout issues well-documented
- Data provider (ScrapIn): LOW -- core capabilities unverified; this is the #1 risk
- Fuzzy matching: HIGH -- Fuse.js is well-documented and straightforward for this use case

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable stack, 30 days)
