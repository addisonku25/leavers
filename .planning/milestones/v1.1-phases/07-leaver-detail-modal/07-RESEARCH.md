# Phase 7: Leaver Detail Modal - Research

**Researched:** 2026-03-11
**Domain:** Modal UI, auth-gated content, server-side PII stripping, vertical timeline
**Confidence:** HIGH

## Summary

Phase 7 connects the existing leaver data (Phase 5) and drill-down interaction patterns (Phase 6) into a modal that shows individual career histories. The work spans four layers: (1) making role rows in company cards clickable, (2) building a server action that fetches leaver data with auth-aware PII stripping, (3) rendering a Dialog modal with vertical timeline UI, and (4) implementing the auth-gate overlay with blurred PII for unauthenticated users.

All required infrastructure is already in place. The `leavers` and `leaver_positions` tables exist with FK relationships to `migrations`. The shadcn/ui Dialog component is installed and uses Radix primitives with built-in accessibility (focus trap, escape key, backdrop click). Better Auth provides both server-side session checks (`auth.api.getSession`) and client-side hooks (`useSession` from `better-auth/react`). The mock provider generates 5-10 leavers per migration with 2-4 career positions each.

**Primary recommendation:** Build the server action first (query + PII stripping), then the modal components, then wire click handlers through the existing CompanyCard > RoleList component chain. Keep the modal state local (useState in CompanyGrid or ResultsDashboard) rather than adding to the DrillDownProvider -- the modal is a "peek deeper" layer that does not interact with Sankey drill-down state.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hover underline on role text + cursor pointer; entire row is click target (dot + name + count)
- Clicking a role always opens the modal regardless of Sankey highlight state
- "+N more roles" button stays as expand toggle; individual roles become clickable after expanding
- Vertical timeline: filled circle for current position, open circles for past; most recent at top
- Each timeline node: title @ company, date range
- Modal header: "Role @ Company" + "N people made this transition"
- Show first 3 leavers expanded by default, "Show N more" button for rest
- All visible timelines are expanded (no collapse per leaver)
- Unauthenticated: first leaver visible with full career data but name/LinkedIn blurred; remaining behind frosted glass overlay with sign-up CTA
- CTA links to /signup with redirect parameter
- Server-side PII stripping: name and linkedinUrl never sent to unauthenticated clients (PRIV-05)
- Career data (companies, titles, dates) is NOT PII -- visible to all
- shadcn/ui Dialog component (Radix UI)
- Fade + scale-up animation (~200ms): opacity 0->1, scale 0.95->1
- Full-width sheet on mobile (< 640px), centered overlay with max-width ~lg on desktop
- Opening/closing modal does NOT change Sankey/card drill-down state

### Claude's Discretion
- Server action design for fetching leaver data (query by migrationId)
- Loading state inside modal while data fetches
- Exact blur CSS implementation for names
- Frosted glass overlay styling
- Timeline line styling (color, width, spacing)
- How to handle empty leaver data (migration exists but no leavers stored)
- Responsive breakpoints for sheet vs dialog transition

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LVRD-01 | Roles in company cards are visually clickable | RoleList onClick handler + hover underline CSS; cursor-pointer on row |
| LVRD-02 | Clicking a role opens modal showing individual leavers | Dialog component controlled by state in CompanyGrid/ResultsDashboard; server action fetches data on open |
| LVRD-03 | Modal shows transition date and full career history as timeline | Vertical timeline component; leaverPositions joined via Drizzle query ordered by sortOrder |
| LVRD-04 | Name and LinkedIn link visible for authenticated users only | Server action checks session; includes name/linkedinUrl only when authenticated |
| LVRD-05 | Unauthenticated see blurred name/LinkedIn + sign-up CTA | CSS blur-sm on placeholder text; frosted glass overlay with backdrop-blur; first leaver teaser pattern |
| LVRD-06 | Individual leaver data stored during initial search | Already complete -- Phase 5 stores leavers + positions during searchAction |
| PRIV-04 | Privacy policy updated for individual career data display | New section in /privacy page covering auth-gated individual data |
| PRIV-05 | PII stripped server-side before reaching unauthenticated clients | Server action returns different shapes based on session; name/linkedinUrl omitted when no session |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| radix-ui | 1.4.3 | Dialog primitive (via shadcn/ui) | Already installed; handles a11y, focus trap, escape, backdrop |
| drizzle-orm | 0.45.1 | Query leavers + positions tables | Existing ORM; type-safe joins |
| better-auth | 1.5.4 | Session check (server + client) | Existing auth; `auth.api.getSession` server-side, `useSession` client-side |
| motion | 12.35.1 | Modal entrance animation, timeline stagger | Already used for card animations in Phase 6 |
| lucide-react | 0.577 | Icons (ExternalLink for LinkedIn, Lock for auth gate) | Already installed |

### No New Dependencies Required
Every capability needed is covered by the existing stack. The Dialog component is already generated in `src/components/ui/dialog.tsx`. No new npm packages needed.

## Architecture Patterns

### Recommended New Files
```
src/
  actions/
    leavers.ts              # Server action: getLeaversForMigration(migrationId, isAuthenticated)
  components/results/
    leaver-modal.tsx         # Dialog wrapper: manages open state, fetches data, renders content
    leaver-timeline.tsx      # Single leaver's career timeline (vertical line + nodes)
    auth-gate-overlay.tsx    # Frosted glass CTA overlay for unauthenticated users
```

### Modified Files
```
src/components/results/role-list.tsx      # Add onClick handler, hover underline
src/components/results/company-card.tsx   # Pass onRoleClick through to RoleList
src/components/results/company-grid.tsx   # Pass onRoleClick, manage modal state
src/components/results/results-dashboard.tsx  # Or here -- wherever modal state lives
src/app/privacy/page.tsx                  # Add individual career data section
```

### Pattern 1: Server Action with Auth-Aware PII Stripping
**What:** A single server action that returns different response shapes based on authentication status. Authenticated users get full data; unauthenticated get career data with PII fields omitted.
**When to use:** Whenever the same endpoint serves both authenticated and unauthenticated users with different data visibility.

```typescript
// src/actions/leavers.ts
"use server";

import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { leavers, leaverPositions } from "@/lib/db/schema";

interface LeaverPositionData {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
}

interface PublicLeaver {
  id: string;
  currentTitle: string | null;
  currentCompany: string | null;
  transitionDate: string | null;
  positions: LeaverPositionData[];
}

interface AuthenticatedLeaver extends PublicLeaver {
  name: string;
  linkedinUrl: string | null;
}

interface LeaverModalData {
  isAuthenticated: boolean;
  leavers: PublicLeaver[] | AuthenticatedLeaver[];
  totalCount: number;
}

export async function getLeaversForMigration(
  migrationId: string
): Promise<LeaverModalData> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAuthenticated = !!session;

  const rows = await db
    .select()
    .from(leavers)
    .where(eq(leavers.migrationId, migrationId));

  const result = await Promise.all(
    rows.map(async (leaver) => {
      const positions = await db
        .select()
        .from(leaverPositions)
        .where(eq(leaverPositions.leaverId, leaver.id))
        .orderBy(asc(leaverPositions.sortOrder));

      const posData = positions.map((p) => ({
        company: p.company,
        title: p.title,
        startDate: p.startDate,
        endDate: p.endDate,
      }));

      const base: PublicLeaver = {
        id: leaver.id,
        currentTitle: leaver.currentTitle,
        currentCompany: leaver.currentCompany,
        transitionDate: leaver.transitionDate,
        positions: posData,
      };

      if (isAuthenticated) {
        return {
          ...base,
          name: leaver.name,
          linkedinUrl: leaver.linkedinUrl,
        } as AuthenticatedLeaver;
      }

      return base;
    })
  );

  return {
    isAuthenticated,
    leavers: result,
    totalCount: rows.length,
  };
}
```

**Key design choice:** The server action performs the auth check and PII stripping. The client never receives `name` or `linkedinUrl` for unauthenticated sessions. This is PRIV-05.

### Pattern 2: Modal State Management (Local, Not in DrillDownProvider)
**What:** The modal open/close state and selected migration ID live in local component state, not in the global DrillDownProvider.
**Why:** The CONTEXT.md explicitly states "Opening modal does NOT change Sankey/card drill-down state." The modal is an orthogonal interaction layer.

```typescript
// In CompanyGrid or ResultsDashboard
const [modalMigration, setModalMigration] = useState<{
  migrationId: string;
  role: string;
  company: string;
  count: number;
} | null>(null);

// onRoleClick passed down through CompanyCard > RoleList
// When user clicks a role, set modalMigration
// When Dialog closes, set to null
```

**Migration ID lookup:** The results page loads migrations from the DB. The `MigrationRecord` type currently does not include the migration `id` from the database. The results page needs to pass migration IDs through so the modal can query leavers by migration ID. This requires a small change to include `id` in the data passed to `ResultsDashboard`.

### Pattern 3: Responsive Dialog (Sheet on Mobile, Dialog on Desktop)
**What:** Use the existing Dialog component with responsive CSS classes rather than conditionally rendering Sheet vs Dialog.
**Why:** shadcn/ui Dialog already supports customization via className. Override positioning and sizing at the sm: breakpoint.

```typescript
<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none max-sm:rounded-t-xl">
  {/* content */}
</DialogContent>
```

Alternatively, use Vaul (drawer) for mobile -- but the project does not have it installed and adding a new dependency contradicts the "no new libraries" decision from Phase 5 research. Stick with CSS-based responsive behavior on the existing Dialog.

### Pattern 4: Vertical Timeline Component
**What:** Pure presentational component rendering a vertical line with circle nodes.

```typescript
// Simplified structure
<div className="relative pl-6">
  {/* Vertical line */}
  <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

  {positions.map((pos, i) => (
    <div key={i} className="relative pb-4 last:pb-0">
      {/* Circle node */}
      <div className={cn(
        "absolute left-[-16px] top-1 size-3 rounded-full border-2",
        i === 0
          ? "bg-primary border-primary"      // filled for current
          : "bg-background border-muted-foreground"  // open for past
      )} />

      {/* Content */}
      <div>
        <p className="text-sm font-medium">{pos.title} @ {pos.company}</p>
        <p className="text-xs text-muted-foreground">{formatDateRange(pos)}</p>
      </div>
    </div>
  ))}
</div>
```

### Anti-Patterns to Avoid
- **Fetching leaver data during initial search load:** The modal should fetch on open, not during page load. The results page already loads migrations; leavers are loaded lazily.
- **Storing PII in client state and hiding with CSS:** PII must never reach the client for unauthenticated users. The server action must strip it.
- **Adding modal state to DrillDownProvider:** The modal is orthogonal to Sankey drill-down. Mixing them creates coupling and state management complexity.
- **Using `useSession` for server-side auth:** Server actions must use `auth.api.getSession({ headers })`. The `useSession` hook is client-side only and used for rendering decisions (e.g., showing blur vs name).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal a11y (focus trap, escape, backdrop) | Custom modal with useEffect listeners | shadcn/ui Dialog (Radix) | Already installed, handles ARIA, focus trap, scroll lock |
| Auth session check (server) | Custom cookie parsing | `auth.api.getSession({ headers })` | Established pattern in saved-searches.ts |
| Auth session check (client) | Custom fetch to /api/auth | `useSession()` from better-auth/react | Established pattern -- provides `data.session` for conditional rendering |
| Animation on modal enter/exit | Manual CSS keyframes | Dialog's built-in data-state animations | Already configured in dialog.tsx with zoom-in/out-95 and fade |
| ID generation | uuid or Math.random | `nanoid()` | Established pattern throughout codebase |

## Common Pitfalls

### Pitfall 1: Migration ID Not Available in Client Components
**What goes wrong:** The results page currently maps DB rows to `MigrationRecord` objects that omit the `id` field. The modal needs migration IDs to fetch leavers.
**Why it happens:** The original data flow was designed for aggregate display, not per-migration drill-down.
**How to avoid:** Extend the data passed from the results page to include migration `id` alongside `destinationCompany`, `destinationRole`, `sourceRole`, `count`. This is a small change to the results page's `migrationData` mapping and the `MigrationRecord` interface or a parallel lookup structure.
**Warning signs:** Modal opens but has no way to query for the right leavers.

### Pitfall 2: Race Condition on Rapid Role Clicks
**What goes wrong:** User clicks role A, modal opens, data starts fetching. User closes and clicks role B before fetch A completes. Stale data from fetch A renders in modal B.
**Why it happens:** Async server action calls are not cancelled when modal closes.
**How to avoid:** Key the modal content on the migration ID. When migration ID changes, show loading state. Use a simple `useEffect` + state pattern with an abort check (compare current migration ID to fetched migration ID before setting state).
**Warning signs:** Modal shows leavers from a different role than the header indicates.

### Pitfall 3: Server Action Called Without Valid Migration ID
**What goes wrong:** If the migration ID lookup fails (e.g., company/role does not match any migration row), the server action returns empty results.
**Why it happens:** Migration IDs are database-generated. The client needs a reliable way to map (company, role) -> migrationId.
**How to avoid:** Pass migration IDs alongside the migration data from the results page. The server component (results/[id]/page.tsx) has access to the DB and can include IDs.

### Pitfall 4: Blur CSS Leaking Real Content
**What goes wrong:** CSS blur on a real name could be bypassed by inspecting the DOM.
**Why it happens:** If PII is sent to the client and only hidden with CSS.
**How to avoid:** PRIV-05 requires server-side stripping. The blur is applied to placeholder text (e.g., "Sign up to see name"), not to actual PII. The server action never sends name/linkedinUrl to unauthenticated clients.

### Pitfall 5: Dialog Scroll Behavior
**What goes wrong:** Modal content overflows the viewport; user cannot scroll to see all leavers.
**Why it happens:** Dialog is fixed-positioned with no overflow handling.
**How to avoid:** Add `max-h-[85vh] overflow-y-auto` to DialogContent. The "Show N more" button helps keep initial content manageable (3 leavers visible by default).

## Code Examples

### Fetching Leavers with Drizzle (Verified Pattern)
```typescript
// Join leavers with positions for a given migration
const rows = await db
  .select()
  .from(leavers)
  .where(eq(leavers.migrationId, migrationId));

// For each leaver, fetch positions
for (const leaver of rows) {
  const positions = await db
    .select({
      company: leaverPositions.company,
      title: leaverPositions.title,
      startDate: leaverPositions.startDate,
      endDate: leaverPositions.endDate,
    })
    .from(leaverPositions)
    .where(eq(leaverPositions.leaverId, leaver.id))
    .orderBy(asc(leaverPositions.sortOrder));
}
```

### Auth Check in Server Action (Established Pattern from saved-searches.ts)
```typescript
const session = await auth.api.getSession({
  headers: await headers(),
});
if (!session) {
  // Return public data only (no name, no linkedinUrl)
}
```

### Client-Side Auth Check for Rendering (useSession)
```typescript
import { authClient } from "@/lib/auth-client";

// In component
const { data } = authClient.useSession();
const isAuthenticated = !!data?.session;

// Use for conditional rendering: blur vs real name
// But remember: the data itself is already stripped server-side
```

### Redirect After Signup
```typescript
// In CTA link
<Link href={`/signup?redirect=${encodeURIComponent(window.location.pathname)}`}>
  Sign up to see full profiles
</Link>

// In signup flow -- after successful signup, redirect back
// Better Auth's autoSignIn handles session creation
// The signup page reads ?redirect and navigates there after success
```

### Making Role Rows Clickable (RoleList Modification)
```typescript
// Add to RoleListProps
onRoleClick?: (role: string) => void;

// In the role row div, add onClick + hover styles
<div
  key={entry.role}
  onClick={() => onRoleClick?.(entry.role)}
  className={cn(
    "flex items-center justify-between gap-2 cursor-pointer",
    "hover:underline decoration-muted-foreground/50 underline-offset-2",
    // existing highlight styles...
  )}
>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Aggregate-only results | Individual leaver details gated by auth | Phase 5 (data) + Phase 7 (UI) | Core feature addition |
| PRIV-01 (no individual data shown) | Auth-gated individual data (PRIV-04/05) | v1.1 roadmap | Privacy policy update required |

**Note:** PRIV-01 stated "no individual names or identifiable profiles." v1.1 explicitly relaxes this for authenticated users via PRIV-04 and PRIV-05, which gate PII behind auth and strip it server-side for unauthenticated clients.

## Open Questions

1. **Migration ID Plumbing Strategy**
   - What we know: The results page queries `migrations` table and gets rows with `id`, but currently maps them to `MigrationRecord` (which lacks `id`). The modal needs migration IDs.
   - What's unclear: Best approach -- extend `MigrationRecord` to include `id`, or build a separate lookup map?
   - Recommendation: Extend the migration data to include `id` from the DB row. It's the simplest approach -- add `id` to the mapping in `results/[id]/page.tsx` and thread it through `ResultsDashboard` > `CompanyGrid` > `CompanyCard` > `RoleList`.

2. **Empty Leaver State**
   - What we know: LVRD-06 says data is stored during initial search, but some migrations may have 0 leavers (e.g., if the provider's `searchDetailed` returned no leavers for that specific migration, or if the 10-per-migration cap was reached by other migrations).
   - What's unclear: How to handle this gracefully in the modal.
   - Recommendation: Show a message like "No individual data available for this transition" with a close button. The role should still be clickable (no way to know beforehand if leavers exist without querying).

3. **Signup Redirect Flow**
   - What we know: CTA links to `/signup?redirect=...` and Better Auth has `autoSignIn: true`.
   - What's unclear: Whether the existing signup page reads and uses the redirect parameter.
   - Recommendation: Check if the signup page handles redirect. If not, add redirect handling (read query param, router.push after successful signup).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LVRD-01 | Role rows have onClick and hover underline | unit (RTL) | `npx vitest run src/components/results/__tests__/role-list.test.tsx -t "clickable"` | No -- Wave 0 |
| LVRD-02 | Clicking role opens modal with leaver list | integration (RTL) | `npx vitest run src/components/results/__tests__/leaver-modal.test.tsx` | No -- Wave 0 |
| LVRD-03 | Modal shows timeline with positions | unit (RTL) | `npx vitest run src/components/results/__tests__/leaver-timeline.test.tsx` | No -- Wave 0 |
| LVRD-04 | Authenticated users see name + LinkedIn | unit | `npx vitest run src/actions/__tests__/leavers.test.ts -t "authenticated"` | No -- Wave 0 |
| LVRD-05 | Unauthenticated see blurred placeholders | unit | `npx vitest run src/actions/__tests__/leavers.test.ts -t "unauthenticated"` | No -- Wave 0 |
| LVRD-06 | Leaver data stored during search | unit | Already covered by `src/lib/__tests__/search-action.test.ts` | Yes |
| PRIV-04 | Privacy policy updated | unit (RTL) | `npx vitest run src/app/__tests__/legal-pages.test.tsx -t "individual"` | Partial -- file exists, needs new test |
| PRIV-05 | PII stripped server-side | unit | `npx vitest run src/actions/__tests__/leavers.test.ts -t "strips PII"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run build`
- **Phase gate:** Full suite green + manual visual check of modal on mobile and desktop

### Wave 0 Gaps
- [ ] `src/actions/__tests__/leavers.test.ts` -- covers LVRD-04, LVRD-05, PRIV-05 (server action PII stripping)
- [ ] `src/components/results/__tests__/role-list.test.tsx` -- covers LVRD-01 (clickable roles) -- file does not exist yet
- [ ] `src/components/results/__tests__/leaver-modal.test.tsx` -- covers LVRD-02 (modal opens with data)
- [ ] `src/components/results/__tests__/leaver-timeline.test.tsx` -- covers LVRD-03 (timeline rendering)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/ui/dialog.tsx` -- Dialog already installed with Radix primitives
- Existing codebase: `src/lib/db/schema.ts` -- leavers + leaverPositions tables with FK to migrations
- Existing codebase: `src/actions/saved-searches.ts` -- established pattern for server actions with auth check
- Existing codebase: `src/lib/auth-client.ts` -- `createAuthClient()` for client-side useSession
- Existing codebase: `src/lib/data/providers/mock.ts` -- mock generates 5-10 leavers with 2-4 positions per migration

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions from user discussion -- locked implementation choices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in the project
- Architecture: HIGH -- patterns directly follow established codebase conventions (server actions, Dialog, auth checks)
- Pitfalls: HIGH -- identified from reading actual code (migration ID gap, PII stripping boundary, scroll overflow)

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no external dependencies or fast-moving APIs)
