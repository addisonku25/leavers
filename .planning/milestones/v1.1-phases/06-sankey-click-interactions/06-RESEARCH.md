# Phase 6: Sankey Click Interactions - Research

**Researched:** 2026-03-07
**Domain:** React interactive SVG, layout animations, cross-component state
**Confidence:** HIGH

## Summary

This phase adds click interactivity to the existing Sankey diagram, enabling users to click nodes to highlight and promote matching company cards. The implementation requires three main pieces: (1) a shared DrillDownProvider context using React Context + useReducer, (2) extending the SankeySVG component with a `selectedNode` state layer on top of the existing `hoveredNode`, and (3) adding the `motion` library (v12) for smooth card reordering animations.

The existing codebase is well-structured for this change. The SankeySVG component already has hover-based dim/highlight with `connectedNodes`, opacity helpers, and `cursor-pointer` on nodes. The CompanyGrid/CompanyCard/RoleList components are simple render-only components that accept props -- they just need new highlight/dim/auto-expand props threaded through.

**Primary recommendation:** Use `motion` (v12.35.1) for card layout animations via the `layout` prop. Keep Sankey SVG animations CSS-based (transitions already in place). Use React Context + useReducer for cross-component selection state, placed at the ResultsDashboard level.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Promoted company card gets a colored ring border (e.g., blue-500 ring)
- Non-promoted cards dim to reduced opacity (~50-60%) when a selection is active
- Role highlights use a background pill/chip on the matching role row within the card
- If a matching role is hidden behind the "+N more roles" collapse, auto-expand the card to reveal it
- Use framer-motion for layout animations (AnimatePresence/layout props for card reordering)
- Smooth scroll to top of company cards section after clicking a Sankey node (native scrollIntoView)
- Scroll target is the cards section heading, not the specific card
- Animation speed: smooth feel (~400-500ms) for card reorder, opacity transitions, and scroll
- Company node click: matching card promotes to position 1 in grid, ring highlighted, others dimmed
- Role node click: all cards containing that role promote to top, matching role pill-highlighted, non-matching cards dimmed
- Among multiple promoted cards (role click), sort by role count descending (highest first)
- Source node is clickable: acts as a "reset/show all" button to clear any active selection
- SANK-04 toggle: clicking the same node again clears the selection back to default state
- Selected (clicked) node gets a visible stroke outline (e.g., 2px darker border)
- Connected links stay highlighted, non-connected links dim (same as hover but persistent)
- Hover = temporary preview, click = persistent selection (two distinct interaction states)
- Hover temporarily overrides the visual state when a node is already selected; mouse-leave restores the selected state

### Claude's Discretion
- Exact ring color and opacity values for card highlight
- Framer-motion animation easing curves and exact durations
- Stroke outline color/width for selected Sankey node
- How to dim opacity of non-connected Sankey elements when a selection is active vs hovered
- DrillDownProvider implementation details (context shape, reducer actions)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SANK-01 | Click company node to scroll to and highlight matching card, promoted to top | DrillDownProvider dispatches `SELECT_COMPANY`, CompanyGrid reorders, scrollIntoView on section heading |
| SANK-02 | Click role node to filter cards containing that role, promoted to top with role highlighted | DrillDownProvider dispatches `SELECT_ROLE`, CompanyGrid filters/promotes, RoleList auto-expands and pill-highlights |
| SANK-03 | Promoted/filtered cards animate smoothly (CSS transitions) | `motion` layout prop on card wrappers for FLIP-based reorder animation; CSS transitions for opacity/ring |
| SANK-04 | Click again to reset filter/highlight state | DrillDownProvider dispatches `CLEAR` when same node re-clicked; source node click also clears |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | 12.35.1 | Card layout reorder animations | Renamed from framer-motion; supports React 19 (`^18.0.0 \|\| ^19.0.0`); `layout` prop handles FLIP-based position animation automatically |
| React Context + useReducer | (built-in) | Cross-component selection state | Project pattern -- no global state lib; ResultsDashboard already orchestrates both Sankey and cards |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | v4 | Ring borders, opacity transitions, pill highlights | Already in use; `ring-2 ring-blue-500`, `opacity-50`, `transition-opacity` |
| scrollIntoView | (native DOM) | Scroll to company cards section | `{ behavior: "smooth", block: "start" }` on section heading ref |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| motion layout prop | CSS Grid + transition | CSS can't animate grid reordering (items pop); motion uses FLIP transforms |
| React Context | Zustand/Jotai | Overkill for 2-component communication; project has no global state lib |
| scrollIntoView | motion.scroll | Native is simpler and sufficient for one-shot scroll-to-section |

**Installation:**
```bash
npm install motion
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/results/
    drill-down-provider.tsx    # NEW: React Context + useReducer
    sankey-diagram.tsx         # MODIFIED: add onClick, selectedNode, stroke outline
    company-grid.tsx           # MODIFIED: consume context, reorder cards, motion wrappers
    company-card.tsx           # MODIFIED: accept highlight/dim props
    role-list.tsx              # MODIFIED: accept highlightedRole, auto-expand
    results-dashboard.tsx      # MODIFIED: wrap children with DrillDownProvider
```

### Pattern 1: DrillDownProvider (React Context + useReducer)
**What:** Shared selection state between Sankey and CompanyGrid
**When to use:** Any cross-component interaction in the results dashboard

```typescript
// src/components/results/drill-down-provider.tsx
type SelectionType = "company" | "role" | null;

interface DrillDownState {
  type: SelectionType;
  value: string | null;  // company name or role name
  nodeIndex: number | null;  // Sankey node index for visual feedback
}

type DrillDownAction =
  | { type: "SELECT_COMPANY"; company: string; nodeIndex: number }
  | { type: "SELECT_ROLE"; role: string; nodeIndex: number }
  | { type: "CLEAR" };

function drillDownReducer(state: DrillDownState, action: DrillDownAction): DrillDownState {
  switch (action.type) {
    case "SELECT_COMPANY":
      return { type: "company", value: action.company, nodeIndex: action.nodeIndex };
    case "SELECT_ROLE":
      return { type: "role", value: action.role, nodeIndex: action.nodeIndex };
    case "CLEAR":
      return { type: null, value: null, nodeIndex: null };
  }
}
```

### Pattern 2: Layered Hover + Selection in SankeySVG
**What:** Two visual state layers -- hover (temporary) and selection (persistent)
**When to use:** When click and hover both affect the same visual properties

The existing `hoveredNode` state provides temporary highlight on mouse enter/leave. The new `selectedNode` state provides persistent highlight on click. The rendering logic combines both:
- If hovering: use hover state (temporary override)
- Else if selected: use selection state (persistent)
- Else: default state (all nodes full opacity)

```typescript
// Inside SankeySVG -- extend existing opacity helpers
const getEffectiveHighlight = useCallback(() => {
  // Hover takes visual priority (temporary override)
  if (hoveredNode !== null) return hoveredNode;
  // Selection is persistent
  if (selectedNode !== null) return selectedNode;
  return null;
}, [hoveredNode, selectedNode]);
```

### Pattern 3: Motion Layout Animation for Card Reorder
**What:** Smooth FLIP-based position animation when card order changes
**When to use:** When cards reorder due to selection changes

```typescript
import { motion, AnimatePresence } from "motion/react";

// Wrap each card in a motion.div with layout prop
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  <AnimatePresence mode="popLayout">
    {sortedCompanies.map((company) => (
      <motion.div
        key={company.company}
        layout
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <CompanyCard
          data={company}
          isPromoted={isPromoted(company)}
          isDimmed={isDimmed(company)}
          highlightedRole={highlightedRole}
        />
      </motion.div>
    ))}
  </AnimatePresence>
</div>
```

### Pattern 4: SankeyNode Name to CompanyCard Matching
**What:** How to connect Sankey node names to company card data
**When to use:** Determining which card(s) to promote on node click

The existing data model establishes clear matching:
- `SankeyNode.name` (category "company") matches `CompanyCardData.company` for company clicks
- `SankeyNode.name` (category "destination") matches role strings in `CompanyCardData.roles[].role` for role clicks
- `SankeyNode.category === "source"` triggers CLEAR action

### Anti-Patterns to Avoid
- **Animating CSS grid properties directly:** Grid column/row changes cause layout paint, not smooth animation. Use motion's `layout` prop which uses transforms under the hood.
- **Using index as motion key:** Must use `company.company` as key so motion can track elements across reorders.
- **Putting selection state in SankeySVG:** Selection state affects both Sankey and cards. It must live in context above both components, not inside either.
- **Forcing re-render of Sankey on selection change:** The Sankey d3 layout is expensive. Selection state should only affect opacity/stroke, not trigger re-layout of the Sankey graph.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card reorder animation | Manual FLIP calculation | `motion` layout prop | Handles measuring, transforms, cleanup; FLIP is deceptively complex |
| Smooth scroll | Manual `window.scrollTo` with easing | `element.scrollIntoView({ behavior: "smooth" })` | Native, respects user motion preferences |
| Connected node set | Custom graph traversal | Extend existing `connectedNodes` useMemo | Already built for hover; selection just uses the same Set with persistent state |

## Common Pitfalls

### Pitfall 1: Sankey Re-layout on Every Selection Change
**What goes wrong:** Changing state that's in the useMemo dependency array of the Sankey layout triggers a full d3-sankey recalculation, causing visible flicker.
**Why it happens:** Selection state accidentally included in layout useMemo deps.
**How to avoid:** `selectedNode` state lives outside the layout useMemo. It only affects rendering (opacity, stroke) via the `getNodeOpacity`/`getLinkOpacity` callbacks, never the layout computation.
**Warning signs:** Nodes visibly jump positions when clicking.

### Pitfall 2: Motion Layout Conflicts with CSS Grid
**What goes wrong:** Cards animate to wrong positions or flash when using `layout` prop inside a CSS grid.
**Why it happens:** Motion measures element positions, but CSS grid changes can cause intermediate layout states.
**How to avoid:** Apply the `layout` prop to the motion.div wrapper, not the Card itself. Keep the grid container stable (don't change grid-cols based on selection). Only reorder the array, don't change the grid structure.
**Warning signs:** Cards animate to wrong grid cells or overlap temporarily.

### Pitfall 3: Auto-Expand RoleList Not Resetting
**What goes wrong:** Card auto-expands to show highlighted role, but when selection clears, card stays expanded.
**Why it happens:** `expanded` state in RoleList is independent of selection state.
**How to avoid:** Use a `useEffect` in RoleList that resets expanded state when the `highlightedRole` prop changes from a truthy value to null/undefined.
**Warning signs:** Cards accumulate expanded states after multiple selections.

### Pitfall 4: Hover Override Not Restoring Selection State
**What goes wrong:** Hovering a node while another is selected, then moving mouse away, loses the selection visual.
**Why it happens:** `onMouseLeave` sets `hoveredNode` to null but doesn't re-apply selection visual.
**How to avoid:** Rendering logic checks both `hoveredNode` and `selectedNode`. When hoveredNode is null and selectedNode is set, the selection visual is automatically restored because the opacity helpers fall through to the selection check.
**Warning signs:** Selected node visual disappears after hovering another node.

### Pitfall 5: scrollIntoView Fires Before Layout Animation Completes
**What goes wrong:** Scroll happens immediately but cards haven't finished reordering, so scroll position is wrong.
**Why it happens:** scrollIntoView is synchronous with the state change, but motion animations take 400ms.
**How to avoid:** Scroll target is the section heading (which doesn't move), not the promoted card. This sidesteps the timing issue entirely -- the heading is already in its final position.
**Warning signs:** Page scrolls to wrong position, then cards animate into place.

## Code Examples

### Existing Hover Behavior to Extend
```typescript
// Current SankeySVG node rendering (from sankey-diagram.tsx)
// Already has: cursor-pointer, onMouseEnter, transition-opacity
<g
  key={i}
  opacity={nodeOpacity}
  className="cursor-pointer transition-opacity duration-200"
  onMouseEnter={() => setHoveredNode(i)}
>
  <rect ... />
</g>

// Extension: add onClick handler and stroke for selected state
<g
  key={i}
  opacity={nodeOpacity}
  className="cursor-pointer transition-opacity duration-200"
  onMouseEnter={() => setHoveredNode(i)}
  onClick={() => handleNodeClick(i, node)}
>
  <rect
    ...
    stroke={selectedNode === i ? "hsl(221, 83%, 40%)" : "none"}
    strokeWidth={selectedNode === i ? 2 : 0}
  />
</g>
```

### Card Highlight/Dim Pattern
```typescript
// CompanyCard with conditional ring and opacity
<Card className={cn(
  "transition-all duration-400",
  isPromoted && "ring-2 ring-blue-500 shadow-md",
  isDimmed && "opacity-50",
)}>
```

### Role Pill Highlight Pattern
```typescript
// RoleList entry with conditional background
<div className={cn(
  "flex items-center justify-between gap-2 rounded-md px-1 -mx-1",
  "transition-colors duration-300",
  isHighlighted && "bg-blue-50 dark:bg-blue-950/30",
)}>
```

### Auto-Expand for Hidden Highlighted Role
```typescript
// In RoleList: auto-expand when highlighted role is hidden
useEffect(() => {
  if (!highlightedRole) return;
  const hiddenRoles = roles.slice(maxVisible);
  const isHidden = hiddenRoles.some(r => r.role === highlightedRole);
  if (isHidden) setExpanded(true);
}, [highlightedRole, roles, maxVisible]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package | 2024 (v11) | Import from `motion/react` not `framer-motion` |
| `mode="sync"` AnimatePresence | `mode="popLayout"` | motion v11 | Better handling of exit + layout animations together |
| Manual FLIP animation | `layout` prop | motion v5+ | Single prop handles measuring, animating, cleanup |

**Deprecated/outdated:**
- `framer-motion` npm package: Still works but `motion` is the canonical package going forward. Install `motion`, import from `motion/react`.

## Open Questions

1. **Motion + Tailwind CSS v4 compatibility**
   - What we know: Motion v12 works with React 19. Tailwind v4 class-based styling is orthogonal to motion's layout system.
   - What's unclear: Whether Tailwind v4's new CSS variable-based approach causes any issues with motion's layout measurements.
   - Recommendation: Test early in implementation. If issues arise, move transition classes to inline styles on motion components. LOW risk -- motion measures DOM positions, not CSS.

2. **Grid column count impact on layout animation**
   - What we know: The grid uses responsive columns (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). Motion's layout prop should handle this because it measures actual element positions.
   - What's unclear: Whether changing the array order causes cards to animate across column boundaries smoothly.
   - Recommendation: Test with multi-column layout. If jumpy, add `layoutId` prop matching company name for more stable tracking.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (jsdom) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SANK-01 | Company node click dispatches SELECT_COMPANY, card reorders | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- Wave 0 |
| SANK-02 | Role node click dispatches SELECT_ROLE, cards filter | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- Wave 0 |
| SANK-03 | Cards wrapped in motion.div with layout prop | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | No -- Wave 0 |
| SANK-04 | Same node re-click dispatches CLEAR | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/results/__tests__/drill-down.test.tsx` -- covers SANK-01, SANK-02, SANK-04 (reducer logic, context dispatch)
- [ ] `src/components/results/__tests__/company-grid.test.tsx` -- covers SANK-03 (motion wrapper presence, card ordering)
- [ ] Motion mock: `motion/react` must be mocked in jsdom tests since layout animations require real DOM measurements

### Test Notes
- Motion's `layout` prop can't be meaningfully tested in jsdom (no real layout engine). Test that motion.div wrappers exist and that the `layout` prop is set. Visual animation correctness is manual verification.
- DrillDownProvider reducer logic is pure functions -- highly testable without DOM.
- Card reordering logic (sort promoted to top) is a pure array transformation -- test independently.

## Sources

### Primary (HIGH confidence)
- npm registry `motion` package -- v12.35.1, peerDeps `react: ^18.0.0 || ^19.0.0` (verified via `npm info`)
- Project source code -- `sankey-diagram.tsx`, `company-grid.tsx`, `company-card.tsx`, `role-list.tsx`, `results-dashboard.tsx`, `sankey-data.ts`
- Project CONTEXT.md -- user decisions on highlight style, animation approach, interaction semantics

### Secondary (MEDIUM confidence)
- [Motion docs - layout animations](https://motion.dev/docs/react-layout-animations) -- layout prop, AnimatePresence, FLIP transforms
- [Motion docs - installation](https://motion.dev/docs/react-installation) -- import from `motion/react`
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide) -- framer-motion to motion migration

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- motion v12 verified compatible with React 19; single new dependency
- Architecture: HIGH -- DrillDownProvider pattern documented in project STATE.md decisions; existing component structure maps cleanly
- Pitfalls: HIGH -- derived from direct code reading of existing hover behavior and component structure

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable -- motion v12 is mature)
