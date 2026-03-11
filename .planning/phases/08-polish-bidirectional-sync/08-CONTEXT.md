# Phase 8: Polish & Bidirectional Sync - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Company cards and Sankey diagram stay visually synced in both directions. Clicking a company card highlights the corresponding Sankey node (SANK-05), and the interaction is symmetric — clicking either side produces the same visual result. Additionally, a thorough animation polish pass across all Sankey/card interactions to close out v1.1.

</domain>

<decisions>
## Implementation Decisions

### Card Click Target
- Company name in the card header is the click target (not the whole card surface, not a dedicated icon)
- Subtle hover underline + pointer cursor on company name to signal interactivity — text looks normal until hovered
- Role clicks remain separate (open leaver modal) — no conflict with card-level company selection
- Click the promoted card's company name again to toggle off (clear selection) — consistent with Sankey toggle behavior (SANK-04)
- Clicking a different card's company name while one is selected switches directly to the new selection (no intermediate cleared state)

### Visual Sync Behavior
- Full mirror: card click produces identical visual result to Sankey node click — promoted card gets ring highlight, promotes to top, others dim to 50%
- No auto-scroll: card click does not scroll to Sankey diagram — user is already looking at cards, scrolling away would be disorienting
- Clear in place: toggling off from a card does not scroll — cards reorder back to default, Sankey highlight clears, no scroll movement
- Both directions feed through the same DrillDownProvider state — one shared selection model

### Node Index Resolution
- Claude's discretion on how to resolve Sankey node index from company name when cards dispatch selections
- Options: make nodeIndex optional in DrillDownState, or have Sankey resolve index from layout data by matching company name

### Animation Polish
- Thorough pass across all Sankey/card interactions — this is the last phase of v1.1, make it feel cohesive
- Claude's discretion on what to refine: card reorder transitions, Sankey opacity transitions, scroll behavior, hover states
- Fix anything that visibly jars or feels disconnected across the interaction model

### Claude's Discretion
- Node index resolution approach (optional nodeIndex vs Sankey-side lookup)
- Specific animation timing adjustments (easing curves, durations, opacity values)
- Hover underline styling details (color, transition speed)
- Any rough interaction edges discovered during implementation

</decisions>

<specifics>
## Specific Ideas

- The Sankey→card direction is already fully working (Phase 6). This phase adds the reverse direction and ensures both feel identical.
- DrillDownProvider already has SELECT_COMPANY and toggle logic — cards just need to dispatch into it.
- Company name hover underline should feel consistent with role row clickable styling (established in Phase 7).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DrillDownProvider` (drill-down-provider.tsx): React Context + useReducer with SELECT_COMPANY, SELECT_ROLE, CLEAR actions. Cards need to call `dispatch` — currently only Sankey does.
- `CompanyCard` (company-card.tsx): Has `onRoleClick` prop but no card-level click handler. CardHeader/CardTitle available for wrapping company name.
- `CompanyGrid` (company-grid.tsx): Already reads DrillDownState via `useDrillDown()` for card reordering. Uses `reorderCards()` pure function and motion/react layout animations.
- `SankeySVG` (sankey-diagram.tsx): Uses `selectedNode` from DrillDownState for node stroke outline and connected node/link opacity. `handleNodeClick` dispatches with nodeIndex.

### Established Patterns
- Drill-down state: `{ type: "company"|"role"|null, value: string|null, nodeIndex: number|null }` — shared via React Context
- Card animations: motion/react `layout` prop with 400ms ease `[0.4, 0, 0.2, 1]`
- Sankey animations: CSS `transition-opacity duration-200` on nodes/links
- Toggle: clicking same selection clears to INITIAL_STATE (already in reducer)
- Scroll: `scrollIntoView({ behavior: "smooth", block: "start" })` on selection activation (null→non-null transition)

### Integration Points
- `CompanyCard` → needs `onCompanyClick` prop or internal `useDrillDown()` hook
- `CompanyGrid` → may need to pass company click handler or let cards access context directly
- `SankeyDiagram` → may need to resolve nodeIndex from company name when selection comes from card side (no nodeIndex in dispatch)
- `ResultsDashboard` → no changes expected (DrillDownProvider already wraps everything)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-polish-bidirectional-sync*
*Context gathered: 2026-03-11*
