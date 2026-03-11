# Phase 7: Leaver Detail Modal - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Clickable roles in company cards open an auth-gated modal showing individual leavers who made that specific transition, with career history timelines. Authenticated users see names and LinkedIn links; unauthenticated users see a teaser with blurred PII and sign-up CTA. Privacy policy updated to cover individual data display.

</domain>

<decisions>
## Implementation Decisions

### Role Click Affordance
- Hover underline on role text + cursor pointer (clean default, interactive on hover)
- Entire row is the click target (dot + name + count), not just the text — larger hit area
- Clicking a role always opens the modal, regardless of Sankey highlight state (no two-step interaction)
- "+N more roles" button stays as expand toggle — individual roles become clickable after expanding

### Modal Content & Layout
- Vertical timeline for each leaver's career history (most recent at top, connected by timeline line)
- Timeline nodes: filled circle for current position, open circles for past positions
- Each node shows: title @ company, date range
- Modal header: "Role @ Company" + "N people made this transition"
- Show first 3 leavers expanded by default, "Show N more" button for the rest
- All visible timelines are expanded (no collapse per leaver)

### Auth-Gating Experience
- Unauthenticated: First leaver visible with full career data (companies, titles, dates) but name and LinkedIn URL blurred
- Remaining leavers behind a frosted glass overlay with sign-up CTA
- CTA links to /signup with redirect parameter — after signup, user returns to same results page
- Server-side PII stripping: name and linkedinUrl never sent to unauthenticated clients (PRIV-05)
- Career data (companies, titles, dates) is NOT considered PII — visible to all users
- Privacy policy updated with section on individual career data display (PRIV-04)

### Modal Open/Close Behavior
- shadcn/ui Dialog component (Radix UI — handles accessibility, focus trap, escape, backdrop click)
- Fade + scale-up animation (~200ms): opacity 0→1, scale 0.95→1
- Full-width sheet on mobile (< 640px), centered overlay with max-width ~lg on desktop
- Opening modal does NOT change Sankey/card drill-down state — modal is a "peek deeper" layer
- Closing modal returns user to whatever drill-down state was active

### Claude's Discretion
- Server action design for fetching leaver data (query by migrationId)
- Loading state inside modal while data fetches
- Exact blur CSS implementation for names
- Frosted glass overlay styling
- Timeline line styling (color, width, spacing)
- How to handle empty leaver data (migration exists but no leavers stored)
- Responsive breakpoints for sheet vs dialog transition

</decisions>

<specifics>
## Specific Ideas

- The vertical timeline preview (●/○ nodes with │ connector lines) resonated — keep it clean and scannable
- "Role @ Company — N people" header gives immediate context about what transition the user is exploring
- The auth gate should feel like a "peek behind the curtain" — enough value to prove it's worth signing up, not a hard wall

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DrillDownProvider` / `useDrillDown`: Cross-component selection state — modal doesn't interact with it (maintains state)
- `RoleList` component: Already has role rows with seniority dot + count + highlight. Add onClick handler and hover underline
- `CompanyCard` → `RoleList` prop chain: Already passes `highlightedRole`. Add `onRoleClick` callback
- shadcn/ui: Already installed. Add Dialog component via `npx shadcn@latest add dialog`
- Better Auth: `auth-client.ts` provides `useSession()` hook for client-side auth check
- `DetailedLeaver` / `LeaverPosition` types: Already defined in `types.ts`
- `leavers` + `leaver_positions` tables: Already in schema with FK to migrations
- Mock provider `searchDetailed()`: Returns deterministic leaver data

### Established Patterns
- Server actions for data fetching (search.ts, saved-searches.ts)
- motion/react for animations (company-grid.tsx uses layout prop)
- Tailwind CSS transition utilities for hover/opacity effects
- cn() utility for conditional class composition

### Integration Points
- `src/components/results/role-list.tsx`: Add onClick handler, hover underline styles
- `src/components/results/company-card.tsx`: Pass onRoleClick through to RoleList
- `src/components/results/company-grid.tsx`: Pass onRoleClick through from parent
- New: `src/components/results/leaver-modal.tsx` — Dialog with timeline content
- New: `src/components/results/leaver-timeline.tsx` — Vertical timeline component
- New: `src/actions/leavers.ts` — Server action to fetch leavers by migration (with PII stripping)
- `src/app/privacy/page.tsx`: Update privacy policy text

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-leaver-detail-modal*
*Context gathered: 2026-03-11*
