# Phase 6: Sankey Click Interactions - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can click Sankey diagram nodes to navigate, filter, and highlight the company card grid. Company node clicks promote the matching card to top with a highlight. Role node clicks promote all cards containing that role with the role highlighted. Clicking again resets. Bidirectional sync (card-to-Sankey) is Phase 8.

</domain>

<decisions>
## Implementation Decisions

### Highlight & Promotion Style
- Promoted company card gets a colored ring border (e.g., blue-500 ring)
- Non-promoted cards dim to reduced opacity (~50-60%) when a selection is active
- Role highlights use a background pill/chip on the matching role row within the card
- If a matching role is hidden behind the "+N more roles" collapse, auto-expand the card to reveal it

### Animation & Scroll Behavior
- Use framer-motion for layout animations (AnimatePresence/layout props for card reordering)
- Smooth scroll to top of company cards section after clicking a Sankey node (native scrollIntoView)
- Scroll target is the cards section heading, not the specific card (promoted card is at top anyway)
- Animation speed: smooth feel (~400-500ms) for card reorder, opacity transitions, and scroll

### Filter vs Promote Semantics
- Company node click: matching card promotes to position 1 in grid, ring highlighted, others dimmed
- Role node click: all cards containing that role promote to top, matching role pill-highlighted, non-matching cards dimmed
- Among multiple promoted cards (role click), sort by role count descending (highest first)
- Source node is clickable: acts as a "reset/show all" button to clear any active selection
- SANK-04 toggle: clicking the same node again clears the selection back to default state

### Click Feedback on Sankey Nodes
- Selected (clicked) node gets a visible stroke outline (e.g., 2px darker border)
- Connected links stay highlighted, non-connected links dim (same as hover but persistent)
- Hover = temporary preview, click = persistent selection (two distinct interaction states)
- Hover temporarily overrides the visual state when a node is already selected; mouse-leave restores the selected state
- Keep existing cursor-pointer on nodes (already in place)

### Claude's Discretion
- Exact ring color and opacity values for card highlight
- Framer-motion animation easing curves and exact durations
- Stroke outline color/width for selected Sankey node
- How to dim opacity of non-connected Sankey elements when a selection is active vs hovered
- DrillDownProvider implementation details (context shape, reducer actions)

</decisions>

<specifics>
## Specific Ideas

- The Sankey already has hover-based dim/highlight behavior (opacity transitions on mouse enter/leave). Click interactions extend this to a persistent state.
- SANK-03 requirement explicitly mentions "CSS transitions" but user chose framer-motion for card reordering. Sankey node animations can remain CSS-based.
- Research decision from v1.1 planning: DrillDownProvider (React Context + useReducer) for cross-component selection state between Sankey and cards.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SankeySVG` component: Already has `hoveredNode` state, `connectedNodes` set, opacity helpers (`getLinkOpacity`, `getNodeOpacity`). Extend with `selectedNode` state and click handlers.
- `CompanyGrid` / `CompanyCard`: Simple render-only components. Need to accept highlight/dim props and reorder logic.
- `RoleList`: Has `expanded` state and "+N more roles" collapse. Need to accept auto-expand and role highlight props.
- `ResultsDashboard`: Orchestrates both Sankey and cards at the same level. Natural place for DrillDownProvider.

### Established Patterns
- Sankey nodes have 3 categories: `source`, `company`, `destination` -- category determines click behavior
- `SankeyNode.name` matches `CompanyCardData.company` for company nodes; destination node names match role strings in cards
- Components use Tailwind CSS classes with `transition-*` utilities for animations
- State management: local useState/useReducer in components (no global state lib)

### Integration Points
- `src/components/results/results-dashboard.tsx`: Wrap with DrillDownProvider context
- `src/components/results/sankey-diagram.tsx`: Add click handler, selectedNode state, stroke outline
- `src/components/results/company-grid.tsx`: Accept selection state, reorder cards, pass highlight/dim props
- `src/components/results/company-card.tsx`: Accept highlight (ring) and dim (opacity) props
- `src/components/results/role-list.tsx`: Accept highlighted role name, auto-expand when highlighted role is hidden
- New dependency: `framer-motion` for card layout animations

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 06-sankey-click-interactions*
*Context gathered: 2026-03-07*
