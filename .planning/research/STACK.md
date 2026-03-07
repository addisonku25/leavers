# Technology Stack: v1.1 Deep Dive Features

**Project:** Leavers
**Researched:** 2026-03-07
**Focus:** Stack additions for Sankey drill-down, leaver detail modal, career history data model

## Verdict: No New Libraries Needed

The existing stack handles every v1.1 requirement. This is a feature implementation milestone, not a stack expansion milestone. Adding libraries would introduce unnecessary complexity and bundle size.

## Capability Mapping

### 1. Smooth Scroll + Animated Card Reordering (Sankey Click Interactions)

| Capability | Solution | Already Available |
|------------|----------|-------------------|
| Scroll to card on Sankey click | `Element.scrollIntoView({ behavior: 'smooth' })` | Browser API |
| Highlight matching card | Tailwind CSS conditional classes (`ring-2 ring-primary`) | Tailwind v4 |
| Promote card to top of grid | React state-driven sort order + CSS transitions | React 19 + Tailwind |
| Animated reorder | CSS `transition` on grid items + `order` property | Tailwind v4 |

**Why no animation library (Framer Motion, AutoAnimate, etc.):**
- The reordering animation is a single interaction: click Sankey node, matching cards move to the top of the grid. This is a CSS `order` property change with `transition: transform 300ms ease`.
- Framer Motion adds ~33kB minified to the bundle for layout animations. That cost is unjustifiable for one transition effect.
- `tw-animate-css` is already in devDependencies and provides keyframe utilities if needed, though CSS transitions are sufficient here.
- If the reorder feels janky with pure CSS (cards snap rather than slide), the fallback is `key`-based remounting with entry animations -- still no library needed.

**Implementation pattern:**
```typescript
// State in ResultsDashboard
const [highlightedCompany, setHighlightedCompany] = useState<string | null>(null);

// Pass callback to SankeyDiagram
<SankeyDiagram onNodeClick={(node) => {
  setHighlightedCompany(node.name);
  // scrollIntoView handled by CompanyGrid via ref
}} />

// CompanyGrid sorts highlighted to top, applies ring highlight
// CSS: transition-all duration-300 on each card wrapper
```

**Confidence:** HIGH -- `scrollIntoView` with smooth behavior is supported in all modern browsers. CSS transitions on `order`/`transform` are standard. React state-driven reordering is a fundamental pattern.

### 2. Leaver Detail Modal

| Capability | Solution | Already Available |
|------------|----------|-------------------|
| Modal overlay | shadcn/ui `Dialog` component | Yes (`src/components/ui/dialog.tsx`) |
| Accessible focus trap | Radix UI Dialog primitive | Yes (via `radix-ui` package) |
| Animations | Built into existing Dialog (fade-in/zoom-in) | Yes |
| Close on escape/overlay | Radix UI default behavior | Yes |

**Why the existing Dialog is correct:**
- Already installed, styled, and consistent with the app's design system.
- Radix UI Dialog handles accessibility (focus trap, `aria-modal`, escape key) correctly out of the box.
- The `DialogContent` component already has `sm:max-w-lg` which is appropriate for a leaver detail view. Can be widened to `sm:max-w-xl` or `sm:max-w-2xl` for career history timeline if needed.
- No need for a sheet/drawer variant -- modal is the right pattern for "inspect detail of an item in a list" interactions.

**What NOT to add:**
- Do NOT add a separate sheet component. Sheets are for forms/settings, not detail inspection.
- Do NOT build a custom modal. The Radix primitive handles edge cases (scroll lock, nested modals, portal rendering) that custom implementations consistently get wrong.

**Confidence:** HIGH -- the component is already installed and verified in the codebase.

### 3. Data Model Expansion (Individual Leaver Career Histories)

| Capability | Solution | Already Available |
|------------|----------|-------------------|
| Schema changes | Drizzle ORM + `drizzle-kit push` | Yes |
| New tables | `sqliteTable` definitions in `schema.ts` | Yes |
| Foreign key relationships | Drizzle `references()` | Yes |
| ID generation | `nanoid` package | Yes |

**Schema design recommendation -- use two new relational tables:**

```
leavers
  id (text PK)
  search_id (FK -> searches)
  migration_id (FK -> migrations)  -- links to aggregate record
  name (text, nullable)
  linkedin_url (text, nullable)
  transition_date (text, nullable)  -- ISO date string

leaver_positions
  id (text PK)
  leaver_id (FK -> leavers)
  company (text)
  role (text)
  start_date (text, nullable)
  end_date (text, nullable)
  is_current (integer/boolean)
  sort_order (integer)  -- chronological position
```

**Why relational tables over JSON blob:**
- Career history positions become queryable (future feature: "show all people who went through Company X")
- Drizzle ORM works naturally with relational tables; JSON blobs require manual serialization and lose type safety at the DB boundary
- SQLite handles small relational joins efficiently -- a leaver with 5-8 positions is trivial
- The data is inherently relational (one leaver has many positions)
- Consistent with the existing schema pattern (5 tables already defined this way)

**Confidence:** HIGH -- Drizzle ORM schema additions are well-established in this codebase.

### 4. DataProvider Interface Changes

The `CareerMigration` interface currently returns aggregate data. It needs extension for individual leaver records.

**Recommended approach -- extend with optional individual data:**
```typescript
interface LeaverDetail {
  name?: string;          // null for unauthenticated display
  linkedinUrl?: string;   // null for unauthenticated display
  transitionDate?: string;
  careerHistory: CareerPosition[];
}

interface CareerPosition {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
}

interface CareerMigration {
  // ... existing fields unchanged ...
  leavers?: LeaverDetail[];  // optional, backward-compatible
}
```

**Why extend rather than separate endpoint:** The data flows through a single search action. Fetching individual details at search time (when the provider is called) is more efficient than a second round-trip. The `leavers` array is optional, so the mock provider can populate it while the interface remains backward-compatible with existing providers.

**Confidence:** HIGH -- straightforward TypeScript interface extension with no library implications.

## State Management for Cross-Component Communication

The Sankey-to-Cards interaction requires shared state between `SankeyDiagram` and `CompanyGrid`.

**Use lifted state in `ResultsDashboard` (recommended)** because:
- `ResultsDashboard` already renders both `SankeyDiagram` and `CompanyGrid` as direct children
- Only 2-3 pieces of state needed: `highlightedCompany`, `highlightedRole`, possibly `selectedLeaverRole` for modal
- Prop drilling depth is 1 level (dashboard to child component)
- No need for Context API, Zustand, Jotai, or any state management library for this scope

## What NOT to Add

| Library | Why It Might Seem Needed | Why It Is Not |
|---------|-------------------------|---------------|
| Framer Motion | Animated card reordering | CSS transitions handle this; ~33kB for one animation is wasteful |
| AutoAnimate | Auto-animate list changes | Same reasoning; adds a dependency for a solvable CSS problem |
| React Spring | Physics-based animations | Overkill; this is a business app, not a creative showcase |
| Tanstack Virtual | Virtualized leaver lists | Maximum leaver count per role is bounded (tens, not thousands) |
| Tanstack Query | Modal data fetching | Data is already loaded via server action; modal reads from existing props |
| Zustand/Jotai | Cross-component state | React useState + prop drilling is sufficient for 2-3 components |
| Vaul (drawer) | Mobile-friendly modal | Dialog works on mobile; drawer pattern is wrong for detail inspection |

## Existing Stack -- All Sufficient, No Changes

| Technology | Version | v1.1 Role |
|------------|---------|-----------|
| Next.js | 16.1.6 | Server actions for data fetching, App Router |
| React | 19.2.3 | useState/useRef for click interactions, scrollIntoView |
| TypeScript | ^5 | Interface extensions for leaver types |
| Tailwind CSS v4 | ^4 | Transitions, ring highlights, conditional styling |
| shadcn/ui Dialog | Installed | Leaver detail modal |
| Radix UI | 1.4.3 | Accessible Dialog primitive |
| Drizzle ORM | 0.45.1 | New table definitions (leavers, leaver_positions) |
| Turso (@libsql/client) | 0.17.0 | Relational joins for career history |
| d3-sankey | 0.12.3 | Click event handlers on SVG nodes |
| lucide-react | 0.577.0 | Icons for modal UI elements |
| nanoid | 5.1.6 | IDs for new leaver/position records |

## Installation

```bash
# No new packages to install.
# All v1.1 features are buildable with the current dependency tree.
```

## Sources

- Codebase inspection: `package.json`, `src/components/ui/dialog.tsx`, `src/lib/db/schema.ts`, `src/lib/data/types.ts`, `src/components/results/sankey-diagram.tsx`, `src/components/results/results-dashboard.tsx`
- MDN `Element.scrollIntoView()` -- `behavior: 'smooth'` is universally supported in modern browsers
- CSS `transition` property -- standard for animating `order`, `transform`, `opacity` changes
- Existing Radix UI Dialog in codebase -- verified accessible modal with focus trap, escape handling, portal rendering
