# Phase 5: Data Model Expansion - Research

**Researched:** 2026-03-07
**Domain:** Drizzle ORM schema extension, TypeScript interfaces, mock data generation
**Confidence:** HIGH

## Summary

Phase 5 is a pure data-layer expansion -- no UI changes. The work involves adding two new database tables (`leavers` and `leaver_positions`), extending the TypeScript type system with detailed leaver interfaces, adding an optional `searchDetailed` method to the `DataProvider` interface, and wiring the mock provider to return deterministic fake leaver data.

The existing codebase provides strong patterns to follow. All seven current tables use `text("id").primaryKey()` with `nanoid()` generation. App tables use `integer("created_at", { mode: "timestamp" })`. FK references follow `.references(() => table.id)`. The `simpleHash()` function in `mock.ts` already provides deterministic seeding. No new libraries are needed -- this is purely extending existing patterns.

**Primary recommendation:** Follow existing schema conventions exactly. Link `leavers` to `migrations` (not `searches`) since the downstream modal opens by clicking a role within a company card, which maps 1:1 to a migration record. Use an optional `searchDetailed` method on `DataProvider` rather than changing the existing `search()` return type, preserving backward compatibility.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Store per leaver: name, linkedinUrl, currentTitle, currentCompany
- Explicit `transitionDate` column on leavers table (not derived from career history)
- Career positions: title, company, startDate, endDate (essential fields only)
- Relational table approach (separate `leaver_positions` table) -- matches existing schema patterns
- New `leavers` table (not widening `migrations`) -- avoids Drizzle `push` destruction bug
- Fetch individual data during initial search, not lazily on modal open
- 2-4 career positions per leaver (early/mid-career range) for mock data
- Obviously fake names ("Test User 1", "Mock Person 2") -- no realistic names
- Cap at 5-10 leavers per migration regardless of aggregate count
- Deterministic generation using existing simpleHash pattern

### Claude's Discretion
- FK design (leavers -> migrations vs leavers -> searches)
- searchDetailed interface shape (optional method vs extended return type)
- Career history position ordering and date generation logic
- Leaver_positions table indexing strategy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DMOD-01 | New leavers table stores individual leaver records linked to migrations | Schema patterns documented; FK to migrations recommended; table design with all locked fields specified |
| DMOD-02 | Leaver records include career history (positions with company, title, dates) | Separate `leaver_positions` table with FK to leavers; follows existing relational pattern |
| DMOD-03 | DataProvider interface extended with optional searchDetailed method for per-person data | Optional method pattern documented; new types `DetailedLeaver` and `LeaverPosition` specified |
| DMOD-04 | Mock provider returns deterministic individual leaver data for development | `simpleHash()` extension pattern documented; deterministic name/position generation strategy |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| drizzle-orm | ^0.45.1 | Schema definition, queries | Already used for all 7 tables |
| drizzle-kit | ^0.18.1 | `db:push` schema sync | Already used for schema management |
| nanoid | ^5.1.6 | ID generation | Already used for all record IDs |
| vitest | ^4.0.18 | Testing | Already used for all tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `leaver_positions` table | JSON column on `leavers` | JSON loses queryability and type safety at DB level; relational approach matches existing patterns |
| Optional `searchDetailed` method | Extended `search()` return type | Changing `search()` return type breaks all three providers and cache-manager; optional method is non-breaking |

**Installation:** None needed -- all dependencies already present.

## Architecture Patterns

### New Tables Structure
```
leavers
├── id (text PK, nanoid)
├── migrationId (text FK -> migrations.id)
├── name (text, not null)
├── linkedinUrl (text, nullable)
├── currentTitle (text, nullable)
├── currentCompany (text, nullable)
├── transitionDate (text, nullable)  -- ISO date string, explicit per user decision
├── createdAt (integer, timestamp mode)

leaver_positions
├── id (text PK, nanoid)
├── leaverId (text FK -> leavers.id, cascade delete)
├── company (text, not null)
├── title (text, not null)
├── startDate (text, nullable)  -- ISO date string
├── endDate (text, nullable)    -- ISO date string, null = current
├── sortOrder (integer, not null) -- 0 = most recent
```

### Pattern 1: FK to migrations (not searches)

**What:** Link leavers to migrations via `migrationId` foreign key.
**Why this over searches:** The downstream modal opens when a user clicks a role in a company card. Each company card role corresponds to a `migration` record (destination_company + destination_role). Querying leavers by migration is a direct lookup. Querying by search would require an additional join through migrations to filter by company+role.
**Query pattern:**
```typescript
// When user clicks "Software Engineer" at "Google" in company card:
// migration record already known from the card data
const leavers = await db
  .select()
  .from(leaversTable)
  .where(eq(leaversTable.migrationId, migrationId));
```

### Pattern 2: Optional searchDetailed method

**What:** Add `searchDetailed` as an optional method on the `DataProvider` interface rather than changing the `search()` return type.
**Why:** The existing `search()` method returns `Promise<CareerMigration[]>` and is consumed by `cache-manager.ts`, `search.ts` action, and all three providers. Changing its return type would require touching all consumers. An optional method is additive-only.

```typescript
// In types.ts
export interface DetailedLeaver {
  name: string;
  linkedinUrl?: string;
  currentTitle?: string;
  currentCompany?: string;
  transitionDate?: string;
  positions: LeaverPosition[];
  // Which migration this leaver maps to
  destinationCompany: string;
  destinationRole: string;
}

export interface LeaverPosition {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
}

export interface DetailedSearchResult {
  migrations: CareerMigration[];
  leavers: DetailedLeaver[];
}

export interface DataProvider {
  name: string;
  search(params: MigrationSearchParams): Promise<CareerMigration[]>;
  searchDetailed?(params: MigrationSearchParams): Promise<DetailedSearchResult>;
  healthCheck(): Promise<boolean>;
}
```

### Pattern 3: search.ts integration

**What:** Modify the search action to call `searchDetailed` when available and store leaver records alongside migrations.
**Why:** BrightData already returns per-person data that gets discarded during aggregation. The search action already inserts migrations in a loop -- extend it to also insert leavers and their positions.

```typescript
// In search.ts, after migrations are stored:
if (provider.searchDetailed && detailedResult.leavers.length > 0) {
  for (const leaver of detailedResult.leavers) {
    // Find the matching migration record for FK linkage
    const matchingMigration = insertedMigrations.find(
      m => m.destinationCompany === leaver.destinationCompany
        && m.destinationRole === leaver.destinationRole
    );
    if (!matchingMigration) continue;

    const leaverId = nanoid();
    await db.insert(leaversTable).values({
      id: leaverId,
      migrationId: matchingMigration.id,
      name: leaver.name,
      linkedinUrl: leaver.linkedinUrl,
      currentTitle: leaver.currentTitle,
      currentCompany: leaver.currentCompany,
      transitionDate: leaver.transitionDate,
      createdAt: now,
    });

    for (let i = 0; i < leaver.positions.length; i++) {
      await db.insert(leaverPositionsTable).values({
        id: nanoid(),
        leaverId,
        company: leaver.positions[i].company,
        title: leaver.positions[i].title,
        startDate: leaver.positions[i].startDate,
        endDate: leaver.positions[i].endDate,
        sortOrder: i,
      });
    }
  }
}
```

### Anti-Patterns to Avoid
- **Widening `migrations` table with leaver columns:** Drizzle `push` has a known bug with SQLite column additions that can destroy data. User explicitly chose a new table.
- **Storing career history as JSON blob:** Loses queryability. The relational pattern matches all existing tables.
- **Generating realistic-looking names in mock:** Could create confusion about whether data is real. User explicitly wants "Test User 1" style names.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom ID function | `nanoid()` | Already used everywhere, 21-char URL-safe IDs |
| Deterministic mock data | Random generation | `simpleHash()` from mock.ts | Must be deterministic for test reproducibility |
| Schema management | Manual SQL | `drizzle-kit push` | Already established workflow |

## Common Pitfalls

### Pitfall 1: Drizzle push with SQLite column modifications
**What goes wrong:** `drizzle-kit push` on SQLite can drop and recreate tables when modifying existing columns, potentially losing data.
**Why it happens:** SQLite doesn't support `ALTER TABLE ADD COLUMN` well; Drizzle may use destructive migration strategies.
**How to avoid:** Only ADD new tables (which is what this phase does). Never modify existing table columns via push. The user already decided on new tables instead of widening `migrations` for this reason.
**Warning signs:** `drizzle-kit push` output showing "DROP TABLE" or "recreate" for existing tables.

### Pitfall 2: Migration ID mapping during search insert
**What goes wrong:** When storing leavers, you need to map each leaver to the correct migration record ID. If migrations are inserted without tracking their IDs, you can't create the FK link.
**Why it happens:** The current search action inserts migrations in a loop but doesn't collect the generated IDs.
**How to avoid:** Track migration IDs during insert. Either return IDs from insert statements or build a lookup map from (destinationCompany, destinationRole) -> migrationId.

### Pitfall 3: Cascade delete gaps
**What goes wrong:** When a search expires and gets deleted, orphaned leaver/position records remain.
**Why it happens:** The delete cascade only goes searches -> migrations currently. Need leavers -> cascade from migrations, and positions -> cascade from leavers.
**How to avoid:** Add `{ onDelete: "cascade" }` to both FK references:
- `leavers.migrationId` -> `migrations.id` with cascade
- `leaver_positions.leaverId` -> `leavers.id` with cascade

### Pitfall 4: Position sort order inconsistency
**What goes wrong:** Career history displays in wrong order if sort order isn't explicitly stored.
**Why it happens:** SQLite doesn't guarantee row insertion order on retrieval.
**How to avoid:** Store explicit `sortOrder` column (0 = most recent). Query with `ORDER BY sortOrder ASC`.

### Pitfall 5: transitionDate as text vs integer
**What goes wrong:** Mixing date storage formats between tables.
**Why it happens:** Existing tables use `integer("...", { mode: "timestamp" })` for dates, but transition dates from BrightData are approximate strings like "2024-03" or "Jan 2024".
**How to avoid:** Store `transitionDate` as `text` (ISO date string or partial date). This is not a precise timestamp -- it's a fuzzy date from LinkedIn that may only have month+year precision. Same for `startDate` and `endDate` on positions. Document this difference from the `createdAt` timestamp columns.

## Code Examples

### Schema Definition (follows existing patterns exactly)
```typescript
// Source: matches patterns in src/lib/db/schema.ts

export const leavers = sqliteTable("leavers", {
  id: text("id").primaryKey(),
  migrationId: text("migration_id")
    .notNull()
    .references(() => migrations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  linkedinUrl: text("linkedin_url"),
  currentTitle: text("current_title"),
  currentCompany: text("current_company"),
  transitionDate: text("transition_date"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const leaverPositions = sqliteTable(
  "leaver_positions",
  {
    id: text("id").primaryKey(),
    leaverId: text("leaver_id")
      .notNull()
      .references(() => leavers.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    title: text("title").notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("leaver_positions_leaverId_idx").on(table.leaverId)],
);
```

### Mock Leaver Generation (extends simpleHash pattern)
```typescript
// Source: extends pattern from src/lib/data/providers/mock.ts

function generateMockLeavers(
  migration: CareerMigration,
  migrationIndex: number,
  seed: number,
): DetailedLeaver[] {
  // 5-10 leavers per migration, capped regardless of aggregate count
  const leaverCount = 5 + ((seed + migrationIndex * 17) % 6);
  const leavers: DetailedLeaver[] = [];

  for (let i = 0; i < leaverCount; i++) {
    const leaverSeed = seed + migrationIndex * 100 + i * 31;

    // 2-4 career positions per leaver
    const positionCount = 2 + (leaverSeed % 3);
    const positions: LeaverPosition[] = [];
    const baseYear = 2018 + (leaverSeed % 5);

    for (let j = 0; j < positionCount; j++) {
      positions.push({
        company: j === 0
          ? migration.destinationCompany
          : DESTINATION_COMPANIES[(leaverSeed + j * 7) % DESTINATION_COMPANIES.length],
        title: DESTINATION_ROLES[(leaverSeed + j * 13) % DESTINATION_ROLES.length],
        startDate: `${baseYear + j * 2}-01`,
        endDate: j === 0 ? undefined : `${baseYear + j * 2 + 1}-12`,
      });
    }

    leavers.push({
      name: `Test User ${migrationIndex * 100 + i + 1}`,
      linkedinUrl: `https://linkedin.com/in/test-user-${migrationIndex * 100 + i + 1}`,
      currentTitle: migration.destinationRole,
      currentCompany: migration.destinationCompany,
      transitionDate: `${baseYear}-06`,
      positions,
      destinationCompany: migration.destinationCompany,
      destinationRole: migration.destinationRole,
    });
  }

  return leavers;
}
```

### BrightData Profile Preservation
```typescript
// Source: extends extractPostDeparturePosition in brightdata.ts
// Instead of only extracting the single post-departure position,
// preserve the full experience array as career history

function extractDetailedLeaver(
  profile: BrightDataProfile,
  targetCompany: string,
): DetailedLeaver | null {
  const departure = extractPostDeparturePosition(profile, targetCompany);
  if (!departure) return null;

  const positions: LeaverPosition[] = (profile.experience ?? [])
    .filter((exp) => exp.company && exp.title)
    .map((exp) => ({
      company: exp.company!,
      title: exp.title!,
      startDate: exp.start_date ?? undefined,
      endDate: exp.end_date === "Present" ? undefined : (exp.end_date ?? undefined),
    }));

  // Find transition date (end_date of the target company position)
  const targetLower = targetCompany.toLowerCase();
  const targetExp = (profile.experience ?? []).find(
    (exp) => exp.company?.toLowerCase().includes(targetLower) && exp.end_date && exp.end_date !== "Present"
  );

  return {
    name: profile.name ?? "Unknown",
    linkedinUrl: profile.url ?? profile.input_url,
    currentTitle: profile.position,
    currentCompany: profile.current_company?.name,
    transitionDate: targetExp?.end_date ?? undefined,
    positions,
    destinationCompany: departure.destinationCompany,
    destinationRole: departure.destinationRole,
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drizzle Kit 0.x migrations | `drizzle-kit push` (schemaless sync) | Current in project | No migration files needed; push syncs schema directly |
| JSON career history blob | Relational `leaver_positions` table | This phase decision | Queryable, type-safe, consistent with existing patterns |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --reporter=verbose` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DMOD-01 | Leavers table exists with correct columns and FK to migrations | unit | `npx vitest run src/lib/__tests__/schema-leavers.test.ts -x` | No -- Wave 0 |
| DMOD-02 | Leaver positions table stores career history linked to leavers | unit | `npx vitest run src/lib/__tests__/schema-leavers.test.ts -x` | No -- Wave 0 |
| DMOD-03 | DataProvider interface accepts optional searchDetailed | unit | `npx vitest run src/lib/__tests__/provider.test.ts -x` | Exists (extend) |
| DMOD-04 | Mock provider returns deterministic leaver data | unit | `npx vitest run src/lib/__tests__/provider.test.ts -x` | Exists (extend) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/__tests__/provider.test.ts src/lib/__tests__/schema-leavers.test.ts -x`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/schema-leavers.test.ts` -- covers DMOD-01, DMOD-02 (schema structure validation)
- [ ] Extend `src/lib/__tests__/provider.test.ts` -- covers DMOD-03, DMOD-04 (searchDetailed on mock)

## Open Questions

1. **ScrapIn provider searchDetailed implementation**
   - What we know: BrightData already has per-person data (`BrightDataProfile` with `experience[]`). ScrapIn has `ScrapInPerson` with `positions[]`.
   - What's unclear: Whether ScrapIn provider should also implement `searchDetailed` in this phase.
   - Recommendation: Implement for mock and BrightData only. ScrapIn is unvalidated and follows the same pattern -- can be added later if needed.

2. **Leaver count cap enforcement**
   - What we know: Mock caps at 5-10 per migration. BrightData returns up to 20 profiles total (MAX_PROFILES).
   - What's unclear: Whether to enforce a per-migration cap in the database insert logic or only in providers.
   - Recommendation: Cap in the search action's insert logic (max 10 leavers per migration). This ensures consistent behavior regardless of provider.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/lib/db/schema.ts` (7 existing tables, all patterns documented)
- Direct codebase inspection: `src/lib/data/types.ts` (current DataProvider interface)
- Direct codebase inspection: `src/lib/data/providers/mock.ts` (simpleHash pattern, DESTINATION_COMPANIES/ROLES arrays)
- Direct codebase inspection: `src/lib/data/providers/brightdata.ts` (BrightDataProfile, BrightDataExperience interfaces, extractPostDeparturePosition)
- Direct codebase inspection: `src/actions/search.ts` (current migration insert loop)
- `05-CONTEXT.md` (all user decisions)

### Secondary (MEDIUM confidence)
- Drizzle ORM SQLite documentation for `onDelete: "cascade"` support and index syntax -- verified against existing usage in schema.ts (session, account, verification tables all use indexes and cascade)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, extending existing patterns
- Architecture: HIGH -- all patterns derived from existing codebase; FK and interface decisions well-grounded
- Pitfalls: HIGH -- Drizzle push bug explicitly called out by user; cascade and mapping issues from direct code analysis

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, no external dependencies changing)
