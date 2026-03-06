# Phase 2: Results & Visualization - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the flat migration results list into a grouped dashboard with company cards, role breakdowns, a 3-column Sankey flow visualization, and seniority indicators -- all anonymized. Includes a contextual summary header, polished empty state, and graceful error degradation. Pattern analysis and ranking intelligence belong to Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout & Grouping
- Cards grid layout: each destination company gets a shadcn Card showing company name, total migration count, and role breakdown inside
- 2-3 column responsive grid
- Sorted by total count descending (most popular destinations first)
- Show all companies at once (no pagination or truncation)
- Within each card: show top 3 roles by count, "+X more roles" expands inline for companies with 5+ roles

### Sankey Flow Visualization
- 3-column Sankey: source role (left) -> destination companies (middle) -> destination roles (right)
- Hover highlights connected paths with tooltip showing details (company, role, count)
- No click interactions -- hover only
- Placed ABOVE the company cards grid as the visual "hero" of the results page
- Top 8 destination companies shown as individual nodes; remaining grouped into "Other (X companies)" node
- Always show Sankey regardless of result count (even 1-2 paths)

### Results Summary Header
- Contextual summary at top: "Where [Role]s at [Company] ended up"
- Subtitle with stats: "X people . Y companies . Z roles"
- Prominent "New Search" button in the header
- Text only for v1 -- no company logos or industry tags (logos deferred to v2 per GROW-04)

### Seniority Differentiation (Visual Tag)
- Compare the user's searched role seniority against the leaver's SOURCE role seniority (the role they held at the same company before leaving), NOT the destination role
- Two-tier system: green dot = same or lower seniority level at source company; amber dot = leaver held a more senior version of the role when they left
- Dots appear next to each role in the company cards
- Tooltip on hover explains the meaning ("Similar level" vs "Had more experience")
- This is a visual indicator only -- no sorting or ranking by seniority (that's Phase 3)

### Empty & Edge States
- Polish existing empty state: add illustration/icon, better typography, more prominent "Try Another Search" CTA
- Keep current suggestion text ("try broader role", "larger company", "different spelling")
- Graceful degradation: if Sankey fails to render, show cards without visualization + subtle note. Never block the whole page for one component failure.

### Claude's Discretion
- Sankey library choice (D3, Recharts, or other)
- Exact color palette for seniority dots and Sankey flows
- Card spacing, typography, and shadow styling
- Empty state illustration choice
- Responsive breakpoints for grid columns
- Seniority level parsing logic (how to determine relative seniority from role title strings)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- shadcn Card component (with CardHeader, CardTitle, CardContent, CardFooter subcomponents)
- shadcn Button, Input, Skeleton components
- Results page shell at `src/app/results/[id]/page.tsx` -- currently shows flat list of migrations
- Empty state with suggestions already implemented
- SearchProgress component for loading states
- Lucide icons available

### Established Patterns
- Tailwind v4 with CSS custom properties for theming
- React Server Components for data fetching
- Client components for interactive elements
- `migrations` table: { searchId, destinationCompany, destinationRole, count }
- `searches` table: { id, company, role, status, resultCount }
- Data is already aggregated (count-based, no individual records) -- PRIV-01 largely satisfied

### Integration Points
- Results page fetches data via searchId from URL params
- Search record provides source company + role context
- Migration records provide all destination data needed for cards and Sankey
- No new API endpoints needed -- all data already in database from Phase 1

</code_context>

<specifics>
## Specific Ideas

- Sankey should be the visual centerpiece -- the "aha moment" when users see the flow of where people went
- Seniority comparison is about source role, not destination: "this person was more senior than me when they left" is useful context for how attainable a path is
- Loading experience from Phase 1 (flight-search-engine style progress) should transition smoothly into the results dashboard

</specifics>

<deferred>
## Deferred Ideas

- Seniority-based sorting and ranking of results -- Phase 3 (Insights)
- Company logos next to company names -- v2 (GROW-04)
- Popular search examples in empty state -- could be Phase 3 or backlog
- Click-to-filter from Sankey to cards -- future enhancement

</deferred>

---

*Phase: 02-results-visualization*
*Context gathered: 2026-03-06*
