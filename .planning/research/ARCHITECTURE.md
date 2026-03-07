# Architecture Patterns: v1.1 Deep Dive Integration

**Domain:** Interactive drill-down features for career migration dashboard
**Researched:** 2026-03-07
**Confidence:** HIGH (based on direct codebase analysis + established React/Next.js patterns)

## System Diagram (After v1.1)

```
ResultsPage (Server Component)
  |
  +--> loads search + migrations + leavers from DB
  +--> checks auth (auth.api.getSession)
  +--> passes isAuthenticated boolean to client
  |
  ResultsDashboard (Client Component)
    |
    +--> DrillDownProvider (new React context)
    |     state: { selectedCompany, selectedRole, modalTarget }
    |     actions: selectCompany, selectRole, openModal, clear
    |
    +--> SankeyDiagram
    |     onClick node -> context.selectCompany / context.selectRole
    |
    +--> CompanyGrid
    |     reads context.selectedCompany / context.selectedRole
    |     highlights + reorders cards accordingly
    |     |
    |     +--> CompanyCard
    |           +--> RoleList
    |                 roles are now clickable buttons
    |                 onClick -> context.openModal(company, role)
    |
    +--> LeaverDetailModal (new)
          reads context.modalTarget
          displays career history, transition date
          auth-gated fields (name, LinkedIn) controlled by isAuthenticated prop
```

### Component Boundaries

| Component | Responsibility | New/Modified | Communicates With |
|-----------|---------------|--------------|-------------------|
| `DrillDownProvider` | Shared selection state for Sankey-to-grid coordination | **NEW** | SankeyDiagram, CompanyGrid, LeaverDetailModal |
| `SankeyDiagram` | Visualize flows, emit click events on nodes | **MODIFIED** (add onClick) | DrillDownProvider (write) |
| `CompanyGrid` | Render cards, apply highlight/reorder from context | **MODIFIED** (consume context) | DrillDownProvider (read) |
| `CompanyCard` | Single company display | **MODIFIED** (highlight state) | CompanyGrid (props) |
| `RoleList` | List roles with counts, make roles clickable | **MODIFIED** (button style, onClick) | CompanyCard (props), DrillDownProvider (write) |
| `LeaverDetailModal` | Show individual leaver details with auth-gated fields | **NEW** | DrillDownProvider (read), ResultsDashboard (isAuthenticated prop) |
| `CareerTimeline` | Timeline UI for career history display | **NEW** | LeaverDetailModal (props) |
| `ResultsDashboard` | Orchestrate dashboard, wrap in DrillDownProvider | **MODIFIED** (wrap provider, pass leavers data + auth state) | All child components |
| `ResultsPage` | Server component, load data, check auth | **MODIFIED** (load leavers, pass auth state) | DB, auth.api |

### Data Flow

**Sankey click to card highlight:**
1. User clicks a company node in SankeyDiagram
2. SankeyDiagram calls `onNodeClick({ name: "Google", category: "company" })`
3. ResultsDashboard translates to `dispatch({ type: "SELECT_COMPANY", company: "Google" })`
4. DrillDownProvider updates `selectedCompany` state
5. CompanyGrid re-renders: matching card gets `ring-2 ring-primary` + promoted to index 0
6. CompanyGrid calls `scrollIntoView({ behavior: "smooth", block: "nearest" })` on the highlighted card via a ref

**Role click to leaver modal:**
1. User clicks a role in RoleList (e.g., "Solutions Engineer" at Google)
2. RoleList calls `onRoleClick({ company: "Google", role: "Solutions Engineer" })`
3. DrillDownProvider updates `modalTarget` state
4. LeaverDetailModal renders, filtering leavers data for that company+role
5. Modal shows career history to all users; name + LinkedIn only if `isAuthenticated` is true

**Leaver data loading:**
1. ResultsPage (server) loads leavers from DB alongside migrations
2. Strips PII fields for unauthenticated users before passing to client
3. ResultsDashboard passes sanitized leavers to LeaverDetailModal
4. Modal filters client-side by selected company+role

## Integration Point 1: State Management (Sankey -> Grid)

### Pattern: React Context with useReducer

**Why React Context over alternatives:**
- The state is UI-only (which card is highlighted) -- no need for a global store
- Only 3 components need it (Sankey, CompanyGrid, Modal) -- all under ResultsDashboard
- URL state (searchParams) is wrong here because selections are ephemeral, not shareable
- Zustand/Jotai are overkill for 3 pieces of state with 4 actions

**Why useReducer over useState:**
- Multiple related state fields (`selectedCompany`, `selectedRole`, `modalTarget`) need coordinated updates
- Actions are discrete and nameable (`SELECT_COMPANY`, `SELECT_ROLE`, `OPEN_MODAL`, `CLEAR`)
- Selecting a company should clear the role selection and vice versa -- reducer handles this atomically

### Implementation Shape

```typescript
// src/components/results/drill-down-context.tsx

interface DrillDownState {
  selectedCompany: string | null;
  selectedRole: string | null;
  modalTarget: { company: string; role: string } | null;
}

type DrillDownAction =
  | { type: "SELECT_COMPANY"; company: string }
  | { type: "SELECT_ROLE"; role: string }
  | { type: "OPEN_MODAL"; company: string; role: string }
  | { type: "CLEAR" };

function drillDownReducer(state: DrillDownState, action: DrillDownAction): DrillDownState {
  switch (action.type) {
    case "SELECT_COMPANY":
      return {
        selectedCompany: state.selectedCompany === action.company ? null : action.company,
        selectedRole: null,
        modalTarget: null,
      };
    case "SELECT_ROLE":
      return {
        selectedCompany: null,
        selectedRole: state.selectedRole === action.role ? null : action.role,
        modalTarget: null,
      };
    case "OPEN_MODAL":
      return { ...state, modalTarget: { company: action.company, role: action.role } };
    case "CLEAR":
      return { selectedCompany: null, selectedRole: null, modalTarget: null };
  }
}
```

**Toggle behavior:** Clicking the same node again deselects it. This is natural UX for filter-style interactions and avoids needing a separate "clear" button.

### SankeyDiagram Changes

The SankeyDiagram currently manages hover state internally (`hoveredNode`). Click events are additive -- they don't replace hover. Add an `onNodeClick` callback prop:

```typescript
// Add to SankeyDiagramProps:
onNodeClick?: (node: { name: string; category: "source" | "company" | "destination" }) => void;

// In the node <g> element (line ~219), add alongside onMouseEnter:
onClick={() => onNodeClick?.({
  name: (node as unknown as SankeyNode).name,
  category: (node as unknown as SankeyNode).category,
})}
```

ResultsDashboard translates the click into a context dispatch:

```typescript
const handleSankeyClick = useCallback((node: { name: string; category: string }) => {
  if (node.category === "company") dispatch({ type: "SELECT_COMPANY", company: node.name });
  if (node.category === "destination") dispatch({ type: "SELECT_ROLE", role: node.name });
  // "source" clicks are no-ops -- there's only one source node
}, [dispatch]);
```

### CompanyGrid Changes

CompanyGrid reorders cards so the selected one is first, highlights it visually, and scrolls it into view:

```typescript
const { selectedCompany, selectedRole } = useDrillDown();

const orderedCompanies = useMemo(() => {
  if (!selectedCompany && !selectedRole) return companies;
  return [...companies].sort((a, b) => {
    const aMatch = matchesSelection(a, selectedCompany, selectedRole);
    const bMatch = matchesSelection(b, selectedCompany, selectedRole);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0; // preserve relative order among non-matches
  });
}, [companies, selectedCompany, selectedRole]);
```

**Scroll behavior:** Use a `useEffect` + ref on the first matching card that triggers `scrollIntoView({ behavior: "smooth", block: "nearest" })` when selection changes.

**Role matching for role-node clicks:** When a role is selected via Sankey, CompanyGrid highlights all cards that contain that role. This requires checking `company.roles.some(r => normalizeMatch(r.role, selectedRole))`.

## Integration Point 2: Schema Changes (Leaver Details)

### New Table: `leavers`

The current `migrations` table stores aggregate counts (e.g., "5 people went from Company A to Company B as Role X"). The drill-down needs individual records.

**Design decision: separate table, not denormalization.** Reasons:
- `migrations` serves aggregate views (Sankey, cards) efficiently -- changing it would break all existing queries/transforms
- Individual leavers serve only the detail modal -- different access pattern
- `leavers` links to `migrations` via `migrationId` for easy filtering

```typescript
// Add to src/lib/db/schema.ts

export const leavers = sqliteTable(
  "leavers",
  {
    id: text("id").primaryKey(),
    migrationId: text("migration_id")
      .notNull()
      .references(() => migrations.id),
    transitionDate: text("transition_date"),    // ISO date or partial ("2024", "March 2024")
    careerHistory: text("career_history"),       // JSON stringified array
    name: text("name"),                          // Auth-gated
    linkedinUrl: text("linkedin_url"),            // Auth-gated
  },
  (table) => [index("leavers_migration_id_idx").on(table.migrationId)],
);
```

**Why `careerHistory` as JSON text, not a join table:**
- Career history is read-only display data, never queried/filtered individually
- A normalized `career_entries` table would add complexity for zero query benefit
- SQLite handles JSON text well; Drizzle can parse it on read
- Shape: `Array<{ company: string; role: string; startDate?: string; endDate?: string }>`

**Why `transitionDate` as text, not integer timestamp:**
- LinkedIn dates are often imprecise ("2024", "March 2024")
- Storing as text preserves original granularity
- We never need to sort/filter by transition date in SQL

### Migration Count Consistency

The `migrations.count` field should equal the number of related `leavers` rows for v1.1 data. Strategy:

- When `searchDetailed()` is used, derive count from the number of leavers inserted (update in a transaction)
- For pre-v1.1 searches (no leavers data), `migrations.count` remains valid from the original provider response
- The modal shows "No individual details available" when no leavers exist for a migration

### Schema Migration

Use `drizzle-kit push` as the project already does. The new table is additive -- no existing data is modified.

## Integration Point 3: DataProvider Interface Evolution

### Strategy: Backward-Compatible Extension via Optional Method

The current `DataProvider.search()` returns `CareerMigration[]` (aggregate data). Add an optional `searchDetailed()` that preserves per-person data.

```typescript
// src/lib/data/types.ts

export interface LeaverDetail {
  name?: string;
  linkedinUrl?: string;
  transitionDate?: string;
  careerHistory: Array<{
    company: string;
    role: string;
    startDate?: string;
    endDate?: string;
  }>;
  destinationCompany: string;
  destinationRole: string;
}

export interface DetailedSearchResult {
  migrations: CareerMigration[];
  leavers: LeaverDetail[];
}

export interface DataProvider {
  name: string;
  search(params: MigrationSearchParams): Promise<CareerMigration[]>;
  searchDetailed?(params: MigrationSearchParams): Promise<DetailedSearchResult>;
  healthCheck(): Promise<boolean>;
}
```

**Why optional method instead of changing `search()` return type:**
- `search()` callers (server action, cache-manager) don't need to change
- Providers without detailed data still work unchanged
- The search action tries `searchDetailed` first, falls back to `search`
- Zero breaking changes to existing code

### Provider Adaptation

**MockProvider:** Add `searchDetailed()` that generates fake leaver names, career histories, and LinkedIn URLs using the same deterministic hash approach. Critical for dev/testing without real API calls.

**BrightDataProvider:** Natural fit -- BrightData already returns full profile data (`BrightDataProfile` with `name`, `experience[]`, `url`). The current `search()` method discards per-person data during aggregation in `aggregateTransitions()`. `searchDetailed()` preserves it.

**ScrapInProvider:** Same pattern -- profile-level data that currently gets aggregated can be preserved in `searchDetailed()`.

### Search Action Changes

```typescript
// In src/actions/search.ts, after cache miss:
const provider = getProvider();
let migrations: CareerMigration[];
let leaverDetails: LeaverDetail[] = [];

if (provider.searchDetailed) {
  const detailed = await provider.searchDetailed(params);
  migrations = detailed.migrations;
  leaverDetails = detailed.leavers;
} else {
  migrations = await provider.search(params);
}

// Store migrations as before, then store leavers
// Leavers insertion happens after migration IDs are generated
// so we can link each leaver to its parent migration
```

## Integration Point 4: Auth-Gating in the Modal

### Strategy: Server-Side Field Filtering + Client-Side UI Toggle

**Why not purely client-side auth check:**
- Sensitive data (name, LinkedIn URL) should never reach the browser for unauthenticated users
- `authClient.useSession()` can be spoofed -- it's a convenience for UI, not a security boundary
- The existing pattern uses `auth.api.getSession()` server-side (see `saved-searches.ts`, `search.ts`, `saved/page.tsx`)

**Why not a separate API route for leaver details:**
- Adds an extra round trip for data already loaded with the page
- The results page already does a server-side auth check (`isSearchSaved` calls `auth.api.getSession`)
- Over-engineering for a single boolean decision

### Implementation

**ResultsPage (server component):** Extend existing auth check to conditionally include PII fields.

```typescript
// In src/app/results/[id]/page.tsx
const session = await auth.api.getSession({ headers: await headers() });
const isAuthenticated = !!session;

// Load leavers for this search's migrations
const leaverRows = await db.query.leavers.findMany({
  where: inArray(leavers.migrationId, migrationIds),
});

// Strip PII at the server boundary
const sanitizedLeavers = leaverRows.map((l) => ({
  id: l.id,
  migrationId: l.migrationId,
  transitionDate: l.transitionDate,
  careerHistory: l.careerHistory,
  name: isAuthenticated ? l.name : null,
  linkedinUrl: isAuthenticated ? l.linkedinUrl : null,
}));
```

**LeaverDetailModal (client component):** Receives already-sanitized data. Uses `isAuthenticated` prop purely for UI messaging.

```typescript
interface LeaverDetailModalProps {
  leavers: SanitizedLeaver[];
  isAuthenticated: boolean;
  target: { company: string; role: string } | null;
  onClose: () => void;
}
```

**Why pass `isAuthenticated` as a prop from the server, not use `authClient.useSession()`:**
- Single source of truth -- server already checked
- No flash of unauthenticated content while client session loads
- Avoids the `isPending` state from `useSession()` causing layout shift in the modal

### Modal UI for Unauthenticated Users

Show career history and transition date (public data), replace name/LinkedIn with a CTA:

```
[Career history timeline visible]
[Transition date visible]
-----
Sign in to see this person's name and LinkedIn profile
[Sign In button -> /login?redirect=/results/{id}]
```

This creates a natural upgrade prompt without hiding the product's value.

## Patterns to Follow

### Pattern 1: Lift State to Nearest Common Ancestor
**What:** Put shared UI state (drill-down selection) in a context provider at the ResultsDashboard level, not higher.
**When:** Multiple sibling components need to coordinate on ephemeral UI state.
**Why:** State is scoped to the results page. When the user navigates away, state naturally unmounts. No cleanup needed.

### Pattern 2: Server-Side Data Sanitization
**What:** Filter sensitive fields at the server component boundary before passing to client components.
**When:** Data that should be visible to some users but not others.
**Why:** Client-side checks are bypassable. Data is in the JS bundle if sent unsanitized, regardless of what the UI renders.

### Pattern 3: Optional Interface Methods for Backward Compatibility
**What:** Add `searchDetailed?()` as optional instead of changing `search()` return type.
**When:** Extending an interface with multiple implementations.
**Why:** Existing providers and callers continue working. New functionality is opt-in per provider.

### Pattern 4: JSON Columns for Nested Read-Only Data
**What:** Store career history as a JSON text column rather than a normalized table.
**When:** Data is only displayed, never queried/filtered/joined individually.
**Why:** Eliminates a join table, reduces schema complexity, matches the read pattern.

## Anti-Patterns to Avoid

### Anti-Pattern 1: URL State for Ephemeral Selections
**What:** Storing selected company/role in URL search params.
**Why bad:** Selections are ephemeral. URL state causes unnecessary re-renders via Next.js router, adds browser history entries for each click, makes URLs noisy.
**Instead:** React context with useReducer.

### Anti-Pattern 2: Client-Side Auth for Data Access Control
**What:** Using `authClient.useSession()` to decide whether to show sensitive data already sent to the client.
**Why bad:** Data is in the JS bundle regardless. Users can inspect network requests or React DevTools.
**Instead:** Filter at the server boundary. Never send PII to unauthenticated clients.

### Anti-Pattern 3: Separate API Route for Modal Data
**What:** Creating `/api/leavers/[migrationId]` to lazy-load leaver details on modal open.
**Why bad:** Extra round trip, duplicates auth logic, adds loading state to modal.
**Instead:** Load all leavers for the search in the server component, pass to client. Modal filters client-side.

### Anti-Pattern 4: Modifying the `migrations` Table Structure
**What:** Adding individual leaver fields (name, linkedin, career_history) directly to migrations.
**Why bad:** Migrations is an aggregate table (one row = many people). Adding per-person fields requires breaking it into individual rows, which breaks all existing aggregate queries, Sankey data builder, company card grouping, and insights computation.
**Instead:** New `leavers` table that references `migrations`.

## New vs Modified Files Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/results/drill-down-context.tsx` | React context + reducer for selection state |
| `src/components/results/leaver-detail-modal.tsx` | Modal showing individual leaver career details |
| `src/components/results/career-timeline.tsx` | Timeline UI for career history display |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `leavers` table with index |
| `src/lib/data/types.ts` | Add `LeaverDetail`, `DetailedSearchResult`, optional `searchDetailed` on `DataProvider` |
| `src/lib/data/providers/mock.ts` | Add `searchDetailed()` method with deterministic fake data |
| `src/lib/data/providers/brightdata.ts` | Add `searchDetailed()` (preserve per-person data from profiles) |
| `src/actions/search.ts` | Try `searchDetailed` first, store leavers in DB |
| `src/app/results/[id]/page.tsx` | Load leavers, check auth, sanitize PII, pass to dashboard |
| `src/components/results/results-dashboard.tsx` | Wrap in DrillDownProvider, accept leavers + auth state |
| `src/components/results/sankey-diagram.tsx` | Add `onNodeClick` callback prop |
| `src/components/results/company-grid.tsx` | Consume context, reorder/highlight cards, scroll-into-view |
| `src/components/results/company-card.tsx` | Accept highlight prop, forward role click handler |
| `src/components/results/role-list.tsx` | Make roles clickable buttons with onClick handler |

## Suggested Build Order

Each phase produces something independently testable.

### Phase 1: Schema + Types + Mock Provider
**Build:** `leavers` table, `LeaverDetail` type, `DetailedSearchResult` type, optional `searchDetailed` on `DataProvider`, `MockProvider.searchDetailed()`.
**Why first:** Everything else depends on having the data shape defined and testable fake data available.
**Testable:** `npm run db:push` succeeds, mock provider returns detailed results, unit tests pass.

### Phase 2: Data Ingestion + Server Loading
**Build:** Search action calls `searchDetailed`, stores leavers in DB. ResultsPage loads leavers, sanitizes based on auth.
**Why second:** Data pipeline must work before any UI consumes it.
**Testable:** Search stores leavers in DB, ResultsPage passes sanitized data (verify PII stripped for unauthed).

### Phase 3: Drill-Down Context + Sankey Click
**Build:** `DrillDownProvider`, `SankeyDiagram.onNodeClick`, `CompanyGrid` highlight/reorder, scroll-into-view.
**Why third:** Self-contained UI feature with no dependency on leaver details.
**Testable:** Click Sankey node -> card highlights and scrolls. Click again -> deselects. Click role node -> cards with that role highlight.

### Phase 4: Leaver Detail Modal
**Build:** `LeaverDetailModal`, `CareerTimeline`, clickable roles in `RoleList`, auth-gated field display.
**Why last:** Depends on both data pipeline (Phase 2) and context system (Phase 3) for modal open/close.
**Testable:** Click role -> modal opens with career history. Unauthenticated -> no name/LinkedIn, shows sign-in CTA. Authenticated -> full details.

## Scalability Considerations

| Concern | Current (v1.0) | After v1.1 |
|---------|----------------|------------|
| Data per search | ~20-80 migration rows | Same migrations + ~20-200 leaver rows |
| Page payload | Migration array (~5KB) | + leavers array (~20-50KB) -- still reasonable |
| DB queries per page load | 2 (search + migrations) | 3 (search + migrations + leavers) -- negligible |
| Client memory | Sankey + cards data | + leavers in memory -- fine for up to ~500 leavers |

If leaver counts grow beyond ~500, consider pagination in the modal. But for v1.1 this is unlikely given the 20-profile limit in BrightData.

## Sources

- Direct codebase analysis of all files listed in Component Boundaries table
- React useReducer: standard React pattern for coordinated state transitions
- Server-side sanitization: follows existing `auth.api.getSession()` pattern in `saved-searches.ts`, `search.ts`, `saved/page.tsx`
- BrightData profile data shape: `BrightDataProfile` interface in `providers/brightdata.ts` already contains `name`, `experience[]`, `url`

---
*Architecture research for: Leavers v1.1 Deep Dive*
*Researched: 2026-03-07*
