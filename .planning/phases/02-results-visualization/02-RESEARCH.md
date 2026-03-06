# Phase 2: Results & Visualization - Research

**Researched:** 2026-03-06
**Domain:** Data visualization (Sankey diagrams), React component architecture, role seniority parsing
**Confidence:** HIGH

## Summary

Phase 2 transforms the flat migration results list into a grouped dashboard with company cards, a Sankey flow diagram, seniority indicators, and polished empty/error states. The existing codebase already has the data pipeline, shadcn components, and a results page shell. The primary technical challenge is the Sankey visualization -- specifically choosing between D3-based custom rendering vs. Recharts' built-in Sankey component. A secondary challenge is parsing seniority from role title strings for the visual indicator dots.

A critical discovery: the `migrations` database table does NOT store `sourceRole`, even though the data provider returns it. The seniority comparison feature requires knowing the leaver's source role to compare against the searched role. The schema must be extended before the visualization layer can implement seniority dots.

**Primary recommendation:** Use D3's `d3-sankey` layout engine with React SVG rendering for the Sankey diagram. It provides full control over styling, hover interactions, and the 3-column layout, which Recharts' Sankey component cannot easily achieve. Recharts is simpler but lacks the customization needed for the specific design (3-column with middle company nodes, hover highlighting, "Other" grouping).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cards grid layout: each destination company gets a shadcn Card showing company name, total migration count, and role breakdown inside
- 2-3 column responsive grid, sorted by count descending, show all companies (no pagination)
- Within each card: show top 3 roles by count, "+X more roles" expands inline for 5+ roles
- 3-column Sankey: source role (left) -> destination companies (middle) -> destination roles (right)
- Hover highlights connected paths with tooltip showing details; no click interactions
- Sankey placed ABOVE the company cards grid as the visual "hero"
- Top 8 destination companies shown as individual nodes; remaining grouped into "Other (X companies)" node
- Always show Sankey regardless of result count
- Contextual summary header: "Where [Role]s at [Company] ended up" with stats subtitle and "New Search" button
- Text only for v1 -- no company logos
- Seniority comparison: green dot = same or lower seniority; amber dot = leaver held more senior role at source company
- Dots appear next to roles in company cards with tooltip explanation
- Polish empty state with illustration/icon, better typography, prominent CTA
- Graceful degradation: if Sankey fails, show cards without visualization + subtle note

### Claude's Discretion
- Sankey library choice (D3, Recharts, or other)
- Exact color palette for seniority dots and Sankey flows
- Card spacing, typography, and shadow styling
- Empty state illustration choice
- Responsive breakpoints for grid columns
- Seniority level parsing logic

### Deferred Ideas (OUT OF SCOPE)
- Seniority-based sorting and ranking of results -- Phase 3
- Company logos next to company names -- v2 (GROW-04)
- Popular search examples in empty state -- could be Phase 3 or backlog
- Click-to-filter from Sankey to cards -- future enhancement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-02 | User sees destination companies grouped with migration counts | Company cards grid with shadcn Card, data grouping from migrations table |
| SRCH-03 | User sees what roles former employees moved into at each destination company | Role breakdown within each company card, expandable list pattern |
| SRCH-05 | User sees a helpful empty state when no results are found | Polished empty state with Lucide icon, suggestions, prominent CTA |
| SRCH-06 | User sees a Sankey/flow visualization of career migration paths | d3-sankey layout engine + React SVG rendering, 3-column design |
| PRIV-01 | App displays only aggregated/anonymized data -- no individual names | Already satisfied by data model (count-based, no individual records); verified no PII in schema |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-sankey | ^0.12.3 | Sankey layout computation (node positions, link paths) | Official D3 module, 18M+ weekly downloads, full control over layout |
| @types/d3-sankey | ^0.12.4 | TypeScript definitions for d3-sankey | DefinitelyTyped maintained |
| d3-shape | ^3.2.0 | `linkHorizontal` path generator for Sankey links | Peer dependency of d3-sankey approach |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | (already installed) | Icons for empty state, seniority dots, UI chrome | Already in project |
| shadcn Card | (already installed) | Company cards with CardHeader/CardContent/CardFooter | Already in project |
| tailwind-merge + clsx | (already installed) | Conditional styling for seniority dots, hover states | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| d3-sankey + React SVG | Recharts `<Sankey>` | Recharts is simpler but cannot do 3-column layout with middle nodes, limited hover highlighting control, can't group "Other" node easily |
| d3-sankey + React SVG | MUI X Charts Sankey | Heavy dependency (full MUI), paid for advanced features, overkill for single chart |
| d3-sankey + React SVG | plotly.js | Very large bundle (~3MB), excessive for one chart type |

**Installation:**
```bash
npm install d3-sankey d3-shape && npm install -D @types/d3-sankey @types/d3-shape
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── results/
│   │   ├── results-dashboard.tsx      # Client component: orchestrates all result views
│   │   ├── results-header.tsx         # Summary header with stats + "New Search" button
│   │   ├── sankey-diagram.tsx         # Client component: d3-sankey + React SVG
│   │   ├── company-card.tsx           # Single company card with role breakdown
│   │   ├── company-grid.tsx           # Grid of company cards
│   │   ├── role-list.tsx              # Expandable role list within a card
│   │   ├── seniority-dot.tsx          # Green/amber dot with tooltip
│   │   └── empty-state.tsx            # Polished empty state
│   └── ui/                           # Existing shadcn components
├── lib/
│   ├── seniority.ts                   # Seniority level parsing from role titles
│   └── sankey-data.ts                 # Transform migration data -> Sankey nodes/links
└── app/
    └── results/
        └── [id]/
            └── page.tsx               # Server component: data fetch, pass to dashboard
```

### Pattern 1: D3 Layout + React Rendering
**What:** Use d3-sankey only for layout computation (node positions, link paths). Render all SVG elements with React JSX, not D3 DOM manipulation.
**When to use:** Always -- this is the React-idiomatic way to use D3.
**Example:**
```typescript
// Source: https://www.react-graph-gallery.com/sankey-diagram
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";

interface SankeyNode { name: string; category: "source" | "company" | "destination"; }
interface SankeyLink { source: number; target: number; value: number; }

function SankeyDiagram({ data, width, height }: SankeyProps) {
  const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
    .nodeWidth(15)
    .nodePadding(10)
    .nodeAlign(sankeyJustify)
    .extent([[0, 0], [width, height]]);

  const { nodes, links } = sankeyGenerator({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d })),
  });

  return (
    <svg width={width} height={height}>
      {links.map((link, i) => (
        <path
          key={i}
          d={sankeyLinkHorizontal()(link) || ""}
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth={Math.max(1, link.width || 0)}
          onMouseEnter={() => highlightPath(link)}
          onMouseLeave={() => clearHighlight()}
        />
      ))}
      {nodes.map((node, i) => (
        <rect
          key={i}
          x={node.x0} y={node.y0}
          width={(node.x1 || 0) - (node.x0 || 0)}
          height={(node.y1 || 0) - (node.y0 || 0)}
          fill={colorByCategory(node.category)}
        />
      ))}
    </svg>
  );
}
```

### Pattern 2: Data Transformation Layer
**What:** Separate function to transform flat migration records into Sankey nodes/links format.
**When to use:** Between DB query and Sankey component.
**Example:**
```typescript
// lib/sankey-data.ts
interface MigrationRecord {
  destinationCompany: string;
  destinationRole: string;
  sourceRole?: string;
  count: number;
}

function buildSankeyData(migrations: MigrationRecord[], searchRole: string) {
  // Group by destination company, take top 8
  const companyCounts = groupBy(migrations, "destinationCompany");
  const sorted = Object.entries(companyCounts)
    .sort(([, a], [, b]) => sum(b) - sum(a));

  const top8 = sorted.slice(0, 8);
  const others = sorted.slice(8);

  // Build nodes: [source roles] | [companies] | [destination roles]
  // Build links: source->company (by count), company->destRole (by count)
  // "Other (X companies)" node for remainder
}
```

### Pattern 3: Seniority Level Parsing
**What:** Extract seniority tier from role title strings using prefix/keyword matching.
**When to use:** Comparing searched role against source roles in migration data.
**Example:**
```typescript
// lib/seniority.ts
const SENIORITY_LEVELS: Record<string, number> = {
  "intern": 0,
  "junior": 1, "jr": 1, "associate": 1,
  "": 2,  // default/mid-level (no prefix)
  "senior": 3, "sr": 3,
  "staff": 4, "lead": 4,
  "principal": 5,
  "director": 6,
  "vp": 7, "vice president": 7,
  "svp": 8, "senior vice president": 8,
  "c-level": 9, "chief": 9,
};

function parseSeniorityLevel(roleTitle: string): number {
  const normalized = roleTitle.toLowerCase().trim();
  for (const [prefix, level] of Object.entries(SENIORITY_LEVELS)) {
    if (prefix && normalized.startsWith(prefix)) return level;
    if (prefix && normalized.includes(prefix)) return level;
  }
  return 2; // default mid-level
}

function compareSeniority(searchedRole: string, sourceRole: string): "same-or-lower" | "more-senior" {
  const searchLevel = parseSeniorityLevel(searchedRole);
  const sourceLevel = parseSeniorityLevel(sourceRole);
  return sourceLevel > searchLevel ? "more-senior" : "same-or-lower";
}
```

### Pattern 4: Responsive SVG with Container Query
**What:** Make Sankey diagram responsive by measuring container width.
**When to use:** The Sankey needs explicit width/height but must be responsive.
**Example:**
```typescript
"use client";
import { useRef, useState, useEffect } from "react";

function ResponsiveSankey({ data }: { data: SankeyData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setDimensions({ width: entry.contentRect.width, height: 400 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {dimensions.width > 0 && (
        <SankeyDiagram data={data} width={dimensions.width} height={dimensions.height} />
      )}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **D3 DOM manipulation in React:** Never use `d3.select().append()` -- let React own the DOM, use D3 only for math/layout
- **Importing all of D3:** Import only `d3-sankey` and `d3-shape`, not the full `d3` package (saves ~200KB)
- **Hardcoded SVG dimensions:** Always measure container; hardcoded widths break on mobile
- **Client-side data fetching for results:** Data is already in the DB; use Server Component to fetch, pass as props to client Sankey component

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sankey layout algorithm | Custom node positioning | d3-sankey | Layout algorithms are mathematically complex (iterative relaxation, multi-pass alignment) |
| SVG link paths | Custom bezier curve math | `sankeyLinkHorizontal()` from d3-sankey | Curved path generation handles edge cases like overlapping flows |
| Tooltip positioning | Manual coordinate math | CSS `position: absolute` with `pointer-events: none` on tooltip div overlaying SVG | Browser handles positioning; avoids SVG foreignObject issues |
| Responsive SVG | Window resize listeners | ResizeObserver API | Handles container-level resizes, not just window; more performant |

**Key insight:** D3's layout algorithms took years of research to get right. The Sankey layout involves iterative relaxation to minimize link crossings. Never attempt to compute node positions manually.

## Common Pitfalls

### Pitfall 1: Missing sourceRole in Database
**What goes wrong:** Seniority dots require comparing the searched role against the leaver's SOURCE role, but the `migrations` table only stores `destinationCompany`, `destinationRole`, and `count`. The `sourceRole` from `CareerMigration` is discarded during DB insertion.
**Why it happens:** Phase 1 only needed destination data for the flat list display.
**How to avoid:** Add `sourceRole` column to migrations schema AND update the search action to persist it. Must be done before seniority feature can work.
**Warning signs:** Seniority dots all showing the same color because there's no source role to compare against.

### Pitfall 2: Sankey with Too Many Nodes
**What goes wrong:** If there are 50+ unique destination roles, the Sankey becomes unreadable with tiny, overlapping nodes.
**Why it happens:** No aggregation/grouping of similar roles.
**How to avoid:** Apply the "Top 8 companies" rule AND group rare destination roles into "Other roles" within each company. Keep total visible nodes under ~30.
**Warning signs:** Nodes rendering as 1-2px tall slivers.

### Pitfall 3: SSR Crash with D3 in Next.js
**What goes wrong:** d3-sankey uses browser APIs or ES module features that fail during server-side rendering.
**Why it happens:** Server Components run on Node.js without DOM.
**How to avoid:** The Sankey component MUST be a Client Component (`"use client"` directive). Pass data as serializable props from the Server Component.
**Warning signs:** "window is not defined" or "document is not defined" errors during `next build`.

### Pitfall 4: Hover State Performance
**What goes wrong:** Re-rendering entire SVG on every hover event causes jank.
**Why it happens:** Updating React state on mousemove triggers full re-render of all paths.
**How to avoid:** Use CSS for hover highlighting (opacity transitions via CSS classes) or use `useCallback` + `useMemo` to minimize re-renders. Alternatively, use refs to directly manipulate opacity on hover without state updates.
**Warning signs:** Visible lag when hovering over Sankey links.

### Pitfall 5: Empty Sankey Edge Case
**What goes wrong:** d3-sankey throws or returns garbage when given 0 nodes or 0 links.
**Why it happens:** Layout algorithm assumes non-empty graph.
**How to avoid:** Check for empty data before rendering Sankey. The user decision says "always show Sankey regardless of result count" but guard against truly empty data (0 results handled by empty state instead).
**Warning signs:** Blank SVG or console errors on results page.

## Code Examples

### Data Grouping for Company Cards
```typescript
// Transform flat migrations into grouped card data
interface CompanyCardData {
  company: string;
  totalCount: number;
  roles: { role: string; count: number; seniority: "same-or-lower" | "more-senior" }[];
}

function groupMigrationsForCards(
  migrations: Migration[],
  searchedRole: string,
): CompanyCardData[] {
  const grouped = new Map<string, { role: string; count: number; sourceRole?: string }[]>();

  for (const m of migrations) {
    const existing = grouped.get(m.destinationCompany) || [];
    existing.push({ role: m.destinationRole, count: m.count, sourceRole: m.sourceRole });
    grouped.set(m.destinationCompany, existing);
  }

  return Array.from(grouped.entries())
    .map(([company, roles]) => ({
      company,
      totalCount: roles.reduce((sum, r) => sum + r.count, 0),
      roles: roles
        .map(r => ({
          role: r.role,
          count: r.count,
          seniority: compareSeniority(searchedRole, r.sourceRole || ""),
        }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);
}
```

### Expandable Role List Pattern
```typescript
"use client";
import { useState } from "react";

function RoleList({ roles, maxVisible = 3 }: { roles: Role[]; maxVisible?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? roles : roles.slice(0, maxVisible);
  const hiddenCount = roles.length - maxVisible;

  return (
    <div className="space-y-1">
      {visible.map(r => (
        <div key={r.role} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <SeniorityDot level={r.seniority} />
            {r.role}
          </span>
          <span className="text-muted-foreground">{r.count}</span>
        </div>
      ))}
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-primary hover:underline"
        >
          +{hiddenCount} more roles
        </button>
      )}
    </div>
  );
}
```

### Error Boundary for Sankey Graceful Degradation
```typescript
"use client";
import { Component, type ReactNode } from "react";

class SankeyErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Usage in results page:
// <SankeyErrorBoundary fallback={<SankeyFallbackNote />}>
//   <SankeyDiagram data={sankeyData} />
// </SankeyErrorBoundary>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D3 DOM manipulation in React | D3 for math, React for rendering | ~2020+ | No more `useRef` + `useEffect` D3 rendering; cleaner, more testable |
| Recharts Sankey | d3-sankey directly | When customization is needed | Recharts Sankey is good for simple flows but lacks 3-column and custom hover control |
| `window.addEventListener('resize')` | `ResizeObserver` | Widely supported since 2020 | Container-level responsiveness, not just viewport |

**Deprecated/outdated:**
- react-vis Sankey: Library is deprecated/unmaintained
- Nivo Sankey: Good but adds large dependency tree; overkill for single visualization

## Open Questions

1. **sourceRole column migration strategy**
   - What we know: `CareerMigration` type has `sourceRole`, but DB `migrations` table does not store it
   - What's unclear: Whether existing cached data needs backfill or if we just add the column for new searches
   - Recommendation: Add nullable `sourceRole` column. New searches populate it. For existing data without sourceRole, hide seniority dots (graceful degradation).

2. **Sankey node count limits**
   - What we know: Top 8 companies locked by user decision. Destination roles per company are unbounded.
   - What's unclear: Whether to also cap destination roles in the Sankey or show all
   - Recommendation: Cap at top 5 destination roles per company in the Sankey, group remainder into "Other roles" node. Cards show all roles (with expand).

3. **Seniority parsing accuracy**
   - What we know: Simple prefix matching works for common patterns (Junior/Senior/Staff/etc.)
   - What's unclear: Accuracy for non-standard titles (e.g., "Growth Lead" vs "Team Lead" vs "Lead Engineer")
   - Recommendation: Start with keyword-based parsing. Accept some inaccuracy. Can be improved iteratively. Flag edge cases with default "same-or-lower" (green dot) to avoid false alarms.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-02 | Companies grouped with migration counts | unit | `npx vitest run src/lib/__tests__/sankey-data.test.ts -t "group"` | No - Wave 0 |
| SRCH-03 | Roles shown per destination company | unit | `npx vitest run src/lib/__tests__/sankey-data.test.ts -t "roles"` | No - Wave 0 |
| SRCH-05 | Empty state renders with suggestions | unit | `npx vitest run src/components/__tests__/empty-state.test.tsx` | No - Wave 0 |
| SRCH-06 | Sankey diagram renders with correct nodes/links | unit | `npx vitest run src/components/__tests__/sankey-diagram.test.tsx` | No - Wave 0 |
| PRIV-01 | No individual names in rendered output | unit | `npx vitest run src/lib/__tests__/sankey-data.test.ts -t "privacy"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/sankey-data.test.ts` -- covers SRCH-02, SRCH-03, SRCH-06, PRIV-01 (data transformation logic)
- [ ] `src/lib/__tests__/seniority.test.ts` -- covers seniority level parsing
- [ ] `src/components/__tests__/empty-state.test.tsx` -- covers SRCH-05
- [ ] `src/components/__tests__/sankey-diagram.test.tsx` -- covers SRCH-06 (rendering)

## Sources

### Primary (HIGH confidence)
- d3-sankey npm package docs (https://www.npmjs.com/package/d3-sankey) - API, data format, version
- React Graph Gallery Sankey tutorial (https://www.react-graph-gallery.com/sankey-diagram) - React + D3 integration pattern
- Recharts Sankey API docs (https://recharts.github.io/en-US/api/Sankey/) - Props, limitations, data format
- Project codebase: `src/lib/db/schema.ts`, `src/lib/data/types.ts`, `src/actions/search.ts` - existing data model

### Secondary (MEDIUM confidence)
- @types/d3-sankey npm (https://www.npmjs.com/package/@types/d3-sankey) - TypeScript support, version 0.12.4
- Job seniority level frameworks (multiple HR sources) - common prefix/tier patterns

### Tertiary (LOW confidence)
- Sankey node count performance limits - based on general D3 community knowledge, not benchmarked for this specific setup

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - d3-sankey is the established solution, well-documented, verified API
- Architecture: HIGH - patterns verified against existing codebase structure and Next.js conventions
- Pitfalls: HIGH - sourceRole gap verified by reading actual code; SSR issues are well-documented
- Seniority parsing: MEDIUM - keyword approach is reasonable but accuracy for edge cases is uncertain

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable domain, no fast-moving dependencies)
