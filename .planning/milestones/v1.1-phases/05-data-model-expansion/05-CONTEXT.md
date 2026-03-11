# Phase 5: Data Model Expansion - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

New database tables, TypeScript types, and provider interface extensions to store individual leaver records with career histories. This is the data foundation — no UI changes in this phase. The modal, Sankey interactions, and auth-gating are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Leaver Identity Fields
- Store per leaver: name, linkedinUrl, currentTitle, currentCompany
- Explicit `transitionDate` column on leavers table (not derived from career history)
- Career positions: title, company, startDate, endDate (essential fields only)

### Career History Storage
- Relational table approach (separate `leaver_positions` table) — matches existing schema patterns with 7 relational tables
- New `leavers` table (not widening `migrations`) — avoids Drizzle `push` destruction bug

### Provider Interface
- Fetch individual data during initial search, not lazily on modal open — BrightData already returns per-person data (`name`, `experience[]`, `url`) that gets discarded during aggregation. Store it instead of throwing it away.
- LVRD-06 requirement updated: no lazy-load, data stored at search time
- searchDetailed design: Claude's discretion on whether to extend existing `search()` or add optional method

### FK Design
- How leavers link to migrations vs searches: Claude's discretion based on query patterns (modal opens by clicking a role in a company card → query by migration makes sense)

### Mock Data
- 2-4 career positions per leaver (early/mid-career range)
- Obviously fake names ("Test User 1", "Mock Person 2") — no realistic names
- Cap at 5-10 leavers per migration regardless of aggregate count
- Deterministic generation using existing simpleHash pattern

### Claude's Discretion
- FK design (leavers → migrations vs leavers → searches)
- searchDetailed interface shape (optional method vs extended return type)
- Career history position ordering and date generation logic
- Leaver_positions table indexing strategy

</decisions>

<specifics>
## Specific Ideas

- BrightData already returns the data we need — the provider currently discards individual records during `aggregateTransitions()`. The fix is to preserve them.
- The `BrightDataProfile` interface (brightdata.ts:50-69) already has `name`, `experience[]`, `url` — these map directly to leavers table fields.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `simpleHash()` in mock.ts: Deterministic hash for consistent mock data — extend for leaver generation
- `BrightDataProfile` / `BrightDataExperience` interfaces: Already define the shape of per-person data from BrightData
- `extractPostDeparturePosition()`: Already walks experience arrays — extend to preserve full history

### Established Patterns
- All tables use `text("id").primaryKey()` with generated UUIDs
- App tables use `mode: "timestamp"`, auth tables use `mode: "timestamp_ms"`
- FK references use `.references(() => table.id)` pattern
- Schema defined in single `schema.ts` file

### Integration Points
- `src/lib/db/schema.ts`: Add new `leavers` and `leaver_positions` tables
- `src/lib/data/types.ts`: Add `DetailedLeaver` and `LeaverPosition` types, extend `DataProvider`
- `src/lib/data/providers/mock.ts`: Add `searchDetailed()` with fake leaver generation
- `src/lib/data/providers/brightdata.ts`: Modify to preserve per-person data instead of discarding
- `src/actions/search.ts`: Store leaver records alongside migrations during search

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-data-model-expansion*
*Context gathered: 2026-03-07*
