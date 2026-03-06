# Phase 3: Insights - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Pattern analysis layer that surfaces the "aha moment" from raw migration data. Adds a dedicated insights card with ranked destinations, grouped career paths, and natural-language pattern summaries. No new data fetching — all insights derived from existing migration records. Auth, saved searches, and rate limiting belong to Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Insights Card Placement & Format
- Single shadcn Card placed ABOVE the Sankey diagram, below the results header
- Always visible (not collapsible)
- Three internal sections: Top Destinations, Career Paths, and Pattern Summary
- Card uses existing shadcn Card component (CardHeader, CardContent)

### Top Destinations (INSI-01)
- Top 5 destination companies with percentages in the insights card
- Ranked by pure headcount (no seniority weighting)
- No changes to existing company cards — Sankey node heights already provide visual ranking
- Percentages only (no raw counts) for cleaner presentation

### Career Paths / Role Transitions (INSI-02)
- 4-bucket grouping: Leadership / Business / Technical / Same role
- Keyword-based classification (e.g., "VP", "Director", "Head of" = Leadership; "PM", "Sales", "AE", "Success" = Business; "Engineer", "Architect", "Developer" = Technical; fuzzy match to source role = Same role)
- Each bucket shows percentage + top 2-3 specific role names underneath
- Empty categories hidden (don't show 0% buckets)
- Sorted by percentage descending

### Pattern Summaries (INSI-03)
- Template-based generation (no LLM) — deterministic, instant, free
- 2-3 sentences per summary
- Lead with the most notable pattern (smart ordering, not always top destination)
- Four pattern types detected:
  1. Concentration pattern — "31% went to one company" (single destination dominates vs. spread)
  2. Role change frequency — "Only 22% kept the same title" (pivot vs. lateral move)
  3. Top transition highlight — "The most common move is SE -> Product Manager"
  4. Seniority trend — "Most leavers were at similar seniority" (uses Phase 2 seniority comparison data)

### Claude's Discretion
- Exact template wording and sentence structure for pattern summaries
- Threshold logic for "notable" pattern detection (e.g., what % counts as "dominant")
- Role classification keyword lists and edge case handling
- Card internal spacing, typography, and section divider styling
- How to handle very small result sets (e.g., <5 migrations) — may show fewer sections

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `groupMigrationsForCards()` in `src/lib/sankey-data.ts` — already aggregates by company with counts and seniority
- `buildSankeyData()` — already computes company totals and role groupings
- `MigrationRecord` interface — standard input type with destinationCompany, destinationRole, sourceRole, count
- `CompanyCardData` with `SeniorityComparison` — seniority data already computed per role
- `compareSeniority()` and `normalizeRoleTitle()` in `src/lib/seniority.ts` — reusable for seniority trend detection
- shadcn Card, Button, Skeleton components
- ResultsDashboard component — insights card integrates here between header and Sankey

### Established Patterns
- Client component (`"use client"`) for interactive dashboard elements
- `useMemo` for derived data computations in ResultsDashboard
- Tailwind v4 with CSS custom properties
- Data transformation functions live in `src/lib/` (not in components)

### Integration Points
- ResultsDashboard (`src/components/results/results-dashboard.tsx`) — insert insights card between ResultsHeader and SankeyErrorBoundary
- New insights computation functions go in `src/lib/` (e.g., `src/lib/insights.ts`)
- Input is the same `MigrationRecord[]` and search context already passed to ResultsDashboard

</code_context>

<specifics>
## Specific Ideas

- The insights card is the narrative layer — it tells the story that the Sankey shows visually
- Career path buckets (Leadership/Business/Technical/Same) make the data actionable: "am I likely to stay technical or pivot to business?"
- Pattern summaries should feel like a smart friend summarizing the data, not a dry statistics readout
- Leading with the most notable pattern makes each search feel unique rather than formulaic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-insights*
*Context gathered: 2026-03-06*
