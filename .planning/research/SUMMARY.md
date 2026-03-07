# Project Research Summary

**Project:** Leavers v1.1 Deep Dive
**Domain:** Interactive drill-down features for career migration dashboard
**Researched:** 2026-03-07
**Confidence:** HIGH

## Executive Summary

Leavers v1.1 adds interactive drill-down to an already feature-complete career migration dashboard. The core goal is connecting the Sankey flow visualization to the company card grid (click a node, scroll to the card, highlight it) and exposing individual leaver details behind a modal with auth-gated personal information. This is a UI interaction and data model expansion milestone, not a stack expansion milestone. Every capability needed -- click handlers, smooth scrolling, modal dialogs, schema additions, auth checks -- is already present in the existing dependency tree.

The recommended approach is to treat this as two parallel tracks that converge: (1) Sankey-to-card click interactions using React Context with useReducer for coordinated UI state, and (2) a data model expansion adding a `leavers` table with career history stored as JSON text, linked to the existing `migrations` table via foreign key. These tracks are independent until the leaver detail modal, which requires both the drill-down context (for open/close triggers) and the leaver data (for content). The DataProvider interface extends backward-compatibly via an optional `searchDetailed()` method that preserves individual records the current `search()` method aggregates away.

The primary risks are privacy/legal exposure from displaying individual career data scraped from LinkedIn, SVG click/hover state conflicts in the Sankey diagram, and Drizzle `push` data loss when modifying SQLite schemas. The privacy risk is the most consequential -- it requires architectural decisions (what data to show, removal mechanisms, legal review) before the modal is built. The technical risks are well-understood and have clear prevention strategies documented in the pitfalls research.

## Key Findings

### Recommended Stack

No new libraries are needed. The existing stack handles every v1.1 requirement. See [STACK.md](STACK.md) for full analysis.

**Core technologies (all already installed):**
- **React 19 useState/useReducer + Context**: Cross-component drill-down state (Sankey selections, modal targets) -- 3 pieces of state across 4 components, no global store needed
- **shadcn/ui Dialog (Radix UI)**: Leaver detail modal -- already installed, handles accessibility (focus trap, escape, portal) correctly
- **Drizzle ORM**: New `leavers` table definition -- consistent with existing 5-table schema pattern
- **CSS transitions + `scrollIntoView`**: Card highlight and scroll-to -- browser APIs sufficient, no animation library justified
- **d3-sankey**: Click event handlers on SVG nodes -- add `onClick` alongside existing `onMouseEnter`

**What NOT to add:** Framer Motion (~33kB for one animation), Zustand/Jotai (overkill for 3 state fields), TanStack Query (data already loaded via server action), Vaul drawer (wrong pattern for detail inspection).

### Expected Features

See [FEATURES.md](FEATURES.md) for full feature landscape with dependency diagram.

**Must have (table stakes):**
- Sankey node click scrolls to and highlights matching company card(s)
- Card promotion to top of grid on Sankey click
- Sankey role node click highlights all cards containing that role
- Clickable roles in company cards (visual affordance: button, not plain text)
- Leaver detail modal on role click (career history, transition date)
- Auth-gated name + LinkedIn URL in modal (blur/overlay pattern for unauthenticated users)

**Should have (differentiators):**
- Bidirectional Sankey-card sync (click a card highlights the Sankey node)
- Animated card reorder (CSS transitions, not Framer Motion)
- Leaver count badge on role click targets

**Defer (v2+):**
- Keyboard navigation in Sankey (accessibility pass)
- Complex filtering UI on results page
- Deep-link routes for individual leavers
- Full-page leaver profile routes
- Nested modals for career history entries

### Architecture Approach

The architecture adds 3 new files and modifies 11 existing files, centered on a React Context provider (`DrillDownProvider`) that coordinates selection state between the Sankey diagram, company grid, and leaver detail modal. Data flows server-to-client: the results page server component loads leavers from DB, strips PII for unauthenticated users at the server boundary, and passes sanitized data to client components. The modal receives already-safe data and uses an `isAuthenticated` prop for UI messaging only. See [ARCHITECTURE.md](ARCHITECTURE.md) for complete system diagram, data flows, and build order.

**Major components:**
1. **DrillDownProvider** (new) -- React context with useReducer for `selectedCompany`, `selectedRole`, `modalTarget` state
2. **LeaverDetailModal** (new) -- shadcn Dialog showing career timeline, transition date, auth-gated identity fields
3. **CareerTimeline** (new) -- Vertical timeline UI for career history display within the modal
4. **SankeyDiagram** (modified) -- Adds `onNodeClick` callback prop alongside existing hover behavior
5. **CompanyGrid** (modified) -- Consumes drill-down context, reorders/highlights cards, handles scroll-into-view
6. **ResultsPage** (modified) -- Loads leavers from DB, sanitizes PII based on server-side auth check

### Critical Pitfalls

See [PITFALLS.md](PITFALLS.md) for 12 pitfalls with prevention strategies.

1. **Privacy/legal exposure from individual career data** -- Decide what to show before building the modal. Add a removal mechanism (GDPR/CCPA requirement). Consult a lawyer before launching with real LinkedIn data. Auth-gating is necessary but not sufficient.
2. **SVG click/hover state conflict in Sankey** -- Add separate `selectedNode` state distinct from `hoveredNode`. Selected takes visual priority. Use `onPointerDown` with `pointerType` check for touch devices.
3. **Drizzle `push` data loss on SQLite schema changes** -- Use a new `leavers` table (additive, no existing data touched) instead of modifying `migrations`. Make all new columns nullable. Consider `generate` + `migrate` over `push` for production.
4. **`scrollIntoView` race condition with React state updates** -- Use `useLayoutEffect` watching promoted card state, not synchronous scroll after setState. Add `scroll-margin-top` matching navbar height.
5. **Modal auth content flash** -- Pass `isAuthenticated` as a server-checked prop, not a client-side `useSession()` call. Strip PII at the server boundary so it never reaches the client for unauthenticated users.

## Implications for Roadmap

Based on research, suggested phase structure (4 phases):

### Phase 1: Data Foundation
**Rationale:** Everything else depends on having the data shape defined. The leaver detail modal has nothing to show without individual records. The DataProvider interface extension must exist before the search action can store detailed data.
**Delivers:** `leavers` table in schema, `LeaverDetail` and `DetailedSearchResult` types, optional `searchDetailed()` on DataProvider interface, MockProvider implementation of `searchDetailed()`, search action updated to try `searchDetailed` first and store leavers in DB.
**Addresses:** Data model expansion (table stakes), transition date storage, career history data shape
**Avoids:** Pitfall 2 (push data loss -- new additive table), Pitfall 10 (N+1 queries -- index on `migrationId`), Pitfall 11 (Vercel timeout -- fetch during initial search, not on modal open)

### Phase 2: Sankey Click Interactions
**Rationale:** Independent of leaver data. Can be built and tested with existing aggregate data. Self-contained UI feature that delivers visible value immediately.
**Delivers:** Sankey node click handlers, DrillDownProvider context, CompanyGrid highlight/reorder/scroll-to, Sankey role node click highlighting matching cards, toggle behavior (click same node to deselect).
**Addresses:** All Sankey-to-card table stakes features, animated card reorder (differentiator)
**Avoids:** Pitfall 1 (hover/click conflict -- separate states), Pitfall 4 (grid layout thrash -- prefer highlight+scroll over animated reorder), Pitfall 5 (scroll race condition -- useLayoutEffect), Pitfall 7 (node index instability -- use name+category as identifier)

### Phase 3: Leaver Detail Modal
**Rationale:** Depends on Phase 1 (data exists) and Phase 2 (drill-down context for modal open/close). This is the payoff phase where individual leaver details become visible.
**Delivers:** Clickable roles in RoleList, LeaverDetailModal component, CareerTimeline component, auth-gated name + LinkedIn with blur/overlay pattern, server-side PII sanitization in ResultsPage.
**Addresses:** Leaver detail modal (table stakes), auth-gated content (differentiator), career history timeline (table stakes)
**Avoids:** Pitfall 3 (privacy -- server-side PII stripping, auth-gated display), Pitfall 6 (auth flash -- server-checked `isAuthenticated` prop), Pitfall 9 (focus trap -- test full Sankey->card->modal->close flow), Pitfall 12 (hydration -- keep dialog state client-side only)

### Phase 4: Polish and Bidirectional Sync
**Rationale:** Differentiator features that enhance the experience but are not required for the drill-down to function. Build only after core interactions are solid.
**Delivers:** Bidirectional Sankey-card sync (click card highlights Sankey node), leaver count badges on role buttons, animation refinements, edge case fixes from testing.
**Addresses:** Bidirectional sync (differentiator), leaver count badge (differentiator)

### Phase Ordering Rationale

- **Data before UI:** The modal needs individual leaver records to display. Building the modal first would require placeholder data and a later rewire -- wasteful.
- **Sankey interactions are independent:** They use only existing aggregate data (company names, role names) and can be built and tested without the leaver detail data.
- **Modal depends on both tracks:** It needs the DrillDownProvider (Phase 2) for open/close triggers and the leaver data (Phase 1) for content. Phase 3 is the convergence point.
- **Privacy decisions gate Phase 3:** The modal's design depends on what data is legally displayable. Privacy architecture decisions from Pitfall 3 must be resolved before Phase 3 begins.
- **Polish last:** Bidirectional sync and count badges are nice-to-have. Shipping core drill-down first lets real usage inform whether these differentiators matter.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Privacy/legal review needed before deciding what leaver data to store and display. The technical implementation is straightforward, but the WHAT-to-show decision requires legal input.
- **Phase 3:** Auth-gating UX patterns (blur amount, CTA placement, redirect flow after login) may need design iteration. Test with real users if possible.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Sankey click interactions follow well-documented React patterns (context, useReducer, scrollIntoView, CSS transitions). The pitfalls are documented with clear prevention strategies.
- **Phase 4:** Bidirectional sync is the inverse of Phase 2's one-way flow. Standard lifted-state pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct codebase analysis confirmed all capabilities exist. No new dependencies needed. |
| Features | HIGH | Feature landscape derived from established UX patterns (progressive disclosure, drill-down, freemium gating) with authoritative sources (NN/g, Google Charts). |
| Architecture | HIGH | Architecture based on direct analysis of existing code structure. Patterns (context, useReducer, server-side sanitization) are standard React/Next.js. |
| Pitfalls | HIGH | Pitfalls sourced from known bugs (Drizzle #1313, React #23396), legal frameworks (GDPR, CCPA), and direct codebase analysis of existing hover/click state management. |

**Overall confidence:** HIGH

### Gaps to Address

- **Privacy/legal strategy:** Research identifies the risk clearly but cannot provide legal advice. A lawyer should review the data display plan before Phase 3. The decision of whether to show real names at all (vs. fully anonymized data) is a business/legal decision, not a technical one.
- **Touch device behavior:** Pitfall 1 describes the hover/click conflict but the exact `onPointerDown` + `pointerType` implementation needs testing on real iOS/Android devices, not just Chrome DevTools emulation.
- **Vercel timeout for detailed search:** If `searchDetailed()` with BrightData takes longer than the current `search()` (because it preserves more data per profile), the existing 10-second Vercel timeout concern from v1.0 becomes more pressing. Monitor during Phase 1 implementation.
- **Career history data quality:** LinkedIn career history data from BrightData/ScrapIn may have inconsistent date formats, missing entries, or partial data. The mock provider will mask this; real provider testing is needed before launch.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `package.json`, `schema.ts`, `types.ts`, `sankey-diagram.tsx`, `results-dashboard.tsx`, `dialog.tsx`, and all components listed in architecture research
- [MDN Element.scrollIntoView()](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) -- browser API compatibility
- [Drizzle ORM SQLite push issue #1313](https://github.com/drizzle-team/drizzle-orm/issues/1313) -- confirmed data loss bug
- [React scrollIntoView timing issue #23396](https://github.com/facebook/react/issues/23396) -- DOM update race condition

### Secondary (MEDIUM confidence)
- [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) -- UX pattern authority
- [Google Charts Sankey Interaction](https://developers.google.com/chart/interactive/docs/gallery/sankey) -- standard click/hover behaviors
- [UI Patterns: Paywall](https://ui-patterns.com/patterns/Paywall) -- freemium content gating patterns
- [shadcn/ui Dialog hydration fix](https://truecoderguru.com/blog/shadcn/fix-nextjs-shadcn-dialog-hydration) -- SSR hydration mismatch
- [FLIP animation technique](https://medium.com/ft-product-technology/animating-list-reordering-with-react-hooks-1aa0d78a24dc) -- React list reordering

### Tertiary (LOW confidence)
- [LinkedIn GDPR/CCPA pages](https://privacy.linkedin.com/) -- LinkedIn's stated position, but legal interpretation requires a lawyer
- [How to scrape LinkedIn data legally (2025)](https://blog.closelyhq.com/how-to-scrape-linkedin-data-legally/) -- blog post, not legal advice

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
