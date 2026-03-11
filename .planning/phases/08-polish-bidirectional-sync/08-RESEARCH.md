# Phase 8: Polish & Bidirectional Sync - Research

**Researched:** 2026-03-11
**Domain:** React client-side state synchronization and animation polish
**Confidence:** HIGH

## Summary

Phase 8 is a focused UI interaction phase. The Sankey-to-card direction already works (Phase 6). This phase adds the reverse: clicking a company name in a card dispatches into the same DrillDownProvider, producing identical visual results. The core challenge is that `SELECT_COMPANY` currently requires a `nodeIndex` (Sankey layout position), but card-side clicks don't have that information.

The solution involves either making `nodeIndex` optional in the action/state (letting Sankey resolve it from layout data) or having cards look up the index from Sankey data. Making `nodeIndex` optional is cleaner -- the Sankey component already has the layout in a `useMemo` and can derive the node index from the company name when `nodeIndex` is null. This avoids threading Sankey layout data up to the card layer.

**Primary recommendation:** Make `nodeIndex` optional in `DrillDownAction` and `DrillDownState`. Have `SankeySVG` resolve the node index from its layout when `state.nodeIndex` is null but `state.value` is set. Cards dispatch `SELECT_COMPANY` with `nodeIndex: null`, Sankey handles the visual mapping internally.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Company name in card header is click target (not whole card, not icon)
- Subtle hover underline + pointer cursor on company name -- normal until hovered
- Role clicks remain separate (open leaver modal) -- no conflict
- Click promoted card's company name again to toggle off (consistent with SANK-04)
- Clicking different card switches directly (no intermediate cleared state)
- Full mirror: card click produces identical visual to Sankey node click
- No auto-scroll on card click (user already looking at cards)
- Clear in place: toggling off from card does not scroll
- Both directions feed through same DrillDownProvider

### Claude's Discretion
- Node index resolution approach (optional nodeIndex vs Sankey-side lookup)
- Specific animation timing adjustments (easing curves, durations, opacity values)
- Hover underline styling details (color, transition speed)
- Any rough interaction edges discovered during implementation

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SANK-05 | Clicking a company card highlights the corresponding node in the Sankey diagram (bidirectional sync) | DrillDownProvider already supports SELECT_COMPANY action; cards need to dispatch it. nodeIndex made optional so cards can dispatch without Sankey layout knowledge. Sankey resolves index from layout data internally. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component framework | Already in use |
| motion/react | (installed) | Card layout animations | Already used in CompanyGrid |
| Tailwind CSS | v4 | Styling (hover states, transitions, opacity) | Already in use |

### Supporting
No new libraries needed. This phase uses only existing project dependencies.

## Architecture Patterns

### Pattern 1: Optional nodeIndex in DrillDownProvider
**What:** Change `nodeIndex` from required `number` to optional `number | null` in `SELECT_COMPANY` action. Cards dispatch with `nodeIndex: null`. Sankey derives the correct index from its layout data when rendering.
**When to use:** When the dispatch source doesn't have access to Sankey layout information.

**Current action type:**
```typescript
{ type: "SELECT_COMPANY"; company: string; nodeIndex: number }
```

**New action type:**
```typescript
{ type: "SELECT_COMPANY"; company: string; nodeIndex?: number | null }
```

**Sankey resolution:** In `SankeySVG`, when `drillDown.nodeIndex` is null but `drillDown.value` is set, find the matching node from the layout:
```typescript
const resolvedNodeIndex = useMemo(() => {
  if (drillDown.nodeIndex !== null) return drillDown.nodeIndex;
  if (drillDown.value === null) return null;
  const match = layout.nodes.findIndex(
    (n) => (n as unknown as SankeyNode).name === drillDown.value
  );
  return match >= 0 ? match : null;
}, [drillDown.nodeIndex, drillDown.value, layout.nodes]);
```

Then use `resolvedNodeIndex` instead of `selectedNode` throughout `SankeySVG`.

### Pattern 2: Company Name as Click Target in CardTitle
**What:** Wrap company name text in a clickable element within `CardTitle`, not the entire card.
**Why:** Roles inside the card are already clickable (open modal). Making the whole card clickable would conflict. The company name in the header is a clean, unambiguous target.

```typescript
<CardTitle>
  <button
    type="button"
    onClick={() => handleCompanyClick(data.company)}
    className="hover:underline decoration-muted-foreground/50 underline-offset-2 cursor-pointer transition-[text-decoration] duration-150"
  >
    {data.company}
  </button>
</CardTitle>
```

This mirrors the hover underline pattern already established on role rows in `RoleList`.

### Pattern 3: No Scroll on Card-Initiated Selection
**What:** The `CompanyGrid` `useEffect` that scrolls on selection activation must distinguish card-initiated vs Sankey-initiated selections. Card clicks should NOT auto-scroll (user is already at the cards). Sankey clicks should continue scrolling to cards.
**How:** Track selection source in state or simply remove the scroll behavior from CompanyGrid (Sankey click handlers can scroll imperatively instead). Alternatively, make `nodeIndex` presence the discriminator: if `nodeIndex` is null, selection came from cards, skip scroll.

**Recommended approach:** Use `nodeIndex` as the discriminator. When `nodeIndex` is null (card-initiated), skip the scroll. When `nodeIndex` is a number (Sankey-initiated), scroll as before. This requires no additional state.

```typescript
useEffect(() => {
  // Only scroll when selection is Sankey-initiated (has nodeIndex)
  if (prevTypeRef.current === null && state.type !== null && state.nodeIndex !== null) {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  prevTypeRef.current = state.type;
}, [state.type, state.nodeIndex]);
```

### Anti-Patterns to Avoid
- **Separate state for card selection:** Do NOT create a parallel state system. Both directions must use the single DrillDownProvider.
- **Passing Sankey layout data to cards:** Over-coupling. Cards should dispatch fire-and-forget; Sankey resolves its own visuals.
- **Making entire card clickable:** Conflicts with role click handlers inside the card.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card reorder animation | Manual CSS transforms | motion/react `layout` prop | Already working, handles enter/exit |
| Node index resolution | Custom event bus or callback | useMemo derivation in SankeySVG | Simple array find, no side effects |

## Common Pitfalls

### Pitfall 1: Stale nodeIndex After Layout Recalculation
**What goes wrong:** If Sankey layout changes (e.g., window resize), stored `nodeIndex` in state could point to wrong node.
**Why it happens:** `nodeIndex` is positional in the d3-sankey layout array, not a stable ID.
**How to avoid:** With optional `nodeIndex`, Sankey always resolves by name when `nodeIndex` is null. For Sankey-initiated clicks, the index is fresh from the current layout. Consider always resolving by name for extra safety.
**Warning signs:** Wrong node highlighted after browser resize.

### Pitfall 2: Scroll Firing on Card Clicks
**What goes wrong:** User clicks a company card, page jumps to the "Where they went" heading.
**Why it happens:** The `useEffect` in CompanyGrid triggers on any `null -> non-null` type transition.
**How to avoid:** Gate the scroll on `state.nodeIndex !== null` (card dispatches have null nodeIndex).

### Pitfall 3: Click Event Bubbling
**What goes wrong:** Clicking the company name button also fires the card's parent event handlers.
**Why it happens:** Event bubbling in the DOM.
**How to avoid:** The company name click handler is on a `<button>` inside `CardTitle`. Since the card itself isn't clickable (no onClick on Card), this isn't a problem. But verify role clicks inside CardContent don't interfere -- they use separate handlers on individual role rows.

### Pitfall 4: Toggle Inconsistency
**What goes wrong:** Clicking a promoted card's company name doesn't clear selection.
**Why it happens:** Reducer comparison uses `state.value === action.company` but card might pass slightly different string.
**How to avoid:** Company names come from the same `CompanyCardData.company` field used by both cards and Sankey. Strings should match exactly. Verify with a test.

## Code Examples

### CompanyCard with Company Click Handler
```typescript
// company-card.tsx -- add onCompanyClick prop
interface CompanyCardProps {
  data: CompanyCardData;
  isPromoted?: boolean;
  isDimmed?: boolean;
  highlightedRole?: string | null;
  onRoleClick?: (role: string, migrationId: string) => void;
  onCompanyClick?: (company: string) => void;
  migrationIds?: Map<string, string>;
}

// In CardTitle:
<CardTitle>
  {onCompanyClick ? (
    <button
      type="button"
      onClick={() => onCompanyClick(data.company)}
      className="hover:underline decoration-muted-foreground/50 underline-offset-2 cursor-pointer"
    >
      {data.company}
    </button>
  ) : (
    data.company
  )}
</CardTitle>
```

### CompanyGrid Dispatching Company Clicks
```typescript
// company-grid.tsx -- add dispatch for company clicks
const { state, dispatch } = useDrillDown();

const handleCompanyClick = useCallback((company: string) => {
  dispatch({ type: "SELECT_COMPANY", company, nodeIndex: null });
}, [dispatch]);

// Pass to CompanyCard:
<CompanyCard
  data={company}
  onCompanyClick={handleCompanyClick}
  // ... other props
/>
```

### SankeySVG Resolving nodeIndex from Name
```typescript
// In SankeySVG, replace direct selectedNode usage:
const selectedNode = useMemo(() => {
  if (drillDown.nodeIndex !== null) return drillDown.nodeIndex;
  if (drillDown.value === null || drillDown.type === null) return null;
  const idx = layout.nodes.findIndex((n) => {
    const sn = n as unknown as SankeyNode;
    if (drillDown.type === "company") return sn.category === "company" && sn.name === drillDown.value;
    if (drillDown.type === "role") return sn.category === "destination" && sn.name === drillDown.value;
    return false;
  });
  return idx >= 0 ? idx : null;
}, [drillDown, layout.nodes]);
```

## State of the Art

No technology changes relevant. This phase uses only patterns already established in Phase 6.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sankey-only drill-down | Bidirectional card + Sankey | Phase 8 | Completes the interaction model |

## Open Questions

1. **Should nodeIndex always resolve by name?**
   - What we know: Using name-based resolution for card-initiated clicks is necessary. Sankey-initiated clicks have the index available.
   - What's unclear: Whether to also use name-based resolution for Sankey clicks (more robust to layout changes) or keep the direct index for performance.
   - Recommendation: Use the direct index when available (Sankey clicks), fall back to name resolution (card clicks). The `findIndex` cost is negligible for <50 nodes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (jsdom) |
| Config file | vitest.config.ts |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SANK-05 (reducer) | SELECT_COMPANY with null nodeIndex sets state correctly | unit | `npx vitest run src/components/results/__tests__/drill-down-provider.test.tsx` | Exists (extend) |
| SANK-05 (toggle) | Card-initiated toggle off clears state | unit | `npx vitest run src/components/results/__tests__/drill-down-provider.test.tsx` | Exists (extend) |
| SANK-05 (reorder) | reorderCards handles card-initiated selection (null nodeIndex) | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | Exists (extend) |
| SANK-05 (scroll) | Card-initiated selection does NOT trigger scroll | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | Exists (extend) |
| SANK-05 (visual) | Card click highlights Sankey node | manual-only | Visual verification in browser | N/A |
| SANK-05 (animation) | Animation polish feels cohesive | manual-only | Visual verification in browser | N/A |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. The `drill-down-provider.test.tsx` and `company-grid.test.tsx` files exist and will be extended with new test cases for optional `nodeIndex` behavior.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all relevant source files:
  - `src/components/results/drill-down-provider.tsx` -- reducer, state shape, action types
  - `src/components/results/sankey-diagram.tsx` -- SankeySVG layout, node click handling, opacity logic
  - `src/components/results/company-card.tsx` -- current props, CardTitle structure
  - `src/components/results/company-grid.tsx` -- reorderCards, scroll behavior, motion/react usage
  - `src/components/results/role-list.tsx` -- established hover underline pattern
  - `src/components/results/results-dashboard.tsx` -- DrillDownProvider wrapping, component composition
  - `src/components/results/__tests__/drill-down-provider.test.tsx` -- existing test patterns

No external research needed -- this phase is entirely about wiring existing patterns in a new direction.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing
- Architecture: HIGH -- codebase fully analyzed, patterns clear from source
- Pitfalls: HIGH -- identified from direct code reading, edge cases are bounded

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable -- no external dependencies)
