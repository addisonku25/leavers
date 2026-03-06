# Phase 3: Insights - Research

**Researched:** 2026-03-06
**Domain:** Data aggregation, template-based text generation, React component composition
**Confidence:** HIGH

## Summary

Phase 3 is a pure computation + presentation layer with no new dependencies, no API calls, and no external libraries needed. All insights are derived from the existing `MigrationRecord[]` array already available in `ResultsDashboard`. The work breaks into three clean concerns: (1) a pure-function insights computation module in `src/lib/insights.ts`, (2) template-based natural language generation, and (3) a new `InsightsCard` component slotted into `ResultsDashboard` between the header and Sankey diagram.

The existing codebase already provides every building block: `groupMigrationsForCards()` for company aggregation, `normalizeRoleTitle()` and `parseSeniorityLevel()` for role classification, shadcn `Card` for presentation, and the `useMemo` pattern for derived computations. No new packages are needed.

**Primary recommendation:** Build `src/lib/insights.ts` as a set of pure functions (no React), thoroughly unit-tested, then wrap in a single `InsightsCard` component. Keep all logic in lib, keep the component thin.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single shadcn Card placed ABOVE the Sankey diagram, below the results header
- Always visible (not collapsible)
- Three internal sections: Top Destinations, Career Paths, and Pattern Summary
- Card uses existing shadcn Card component (CardHeader, CardContent)
- Top 5 destination companies with percentages, ranked by pure headcount (no seniority weighting)
- Percentages only (no raw counts) for cleaner presentation
- No changes to existing company cards
- 4-bucket role grouping: Leadership / Business / Technical / Same role
- Keyword-based classification for role buckets
- Each bucket shows percentage + top 2-3 specific role names underneath
- Empty categories hidden (don't show 0% buckets)
- Sorted by percentage descending
- Template-based generation (no LLM) -- deterministic, instant, free
- 2-3 sentences per summary
- Lead with the most notable pattern (smart ordering)
- Four pattern types: Concentration, Role change frequency, Top transition highlight, Seniority trend

### Claude's Discretion
- Exact template wording and sentence structure for pattern summaries
- Threshold logic for "notable" pattern detection (e.g., what % counts as "dominant")
- Role classification keyword lists and edge case handling
- Card internal spacing, typography, and section divider styling
- How to handle very small result sets (e.g., <5 migrations) -- may show fewer sections

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INSI-01 | User sees a ranked list of top destination companies | `groupMigrationsForCards()` already aggregates by company with counts; new function computes top 5 with percentages |
| INSI-02 | User sees common role transitions (what roles people moved into) | Keyword-based classifier using existing `normalizeRoleTitle()` + new keyword lists for Leadership/Business/Technical/Same buckets |
| INSI-03 | User sees pattern summaries | Template-based text generation using computed insights data; no LLM needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component rendering | Already in project |
| shadcn Card | latest | Card component (CardHeader, CardContent) | Already in `src/components/ui/card.tsx` |
| Tailwind v4 | ^4 | Styling | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.18 | Unit testing insights functions | All pure function tests |
| lucide-react | ^0.577.0 | Icons for section headers | Optional enhancement for visual clarity |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Template strings | LLM API (OpenAI/Claude) | LLM adds latency, cost, non-determinism -- user explicitly chose templates |
| Keyword classification | NLP library (compromise, natural) | Overkill for 4-bucket classification; keywords are simpler and sufficient |
| New chart library | Existing Sankey | Sankey already provides visual ranking via node heights; no new vis needed |

**Installation:**
```bash
# No new packages needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── insights.ts              # Pure functions: computeTopDestinations, classifyRoles, generatePatternSummary
│   ├── __tests__/
│   │   └── insights.test.ts     # Unit tests for all insights functions
│   ├── sankey-data.ts           # Existing -- reuse MigrationRecord, groupMigrationsForCards
│   └── seniority.ts             # Existing -- reuse parseSeniorityLevel, normalizeRoleTitle
├── components/
│   └── results/
│       ├── insights-card.tsx    # New component -- thin wrapper rendering computed insights
│       └── results-dashboard.tsx # Modified -- add InsightsCard between header and Sankey
```

### Pattern 1: Pure Computation in lib, Thin Components
**What:** All data transformation and text generation lives in `src/lib/insights.ts` as pure functions. The React component only receives computed data and renders it.
**When to use:** Always for derived data -- this is the established project pattern.
**Example:**
```typescript
// src/lib/insights.ts
export interface TopDestination {
  company: string;
  percentage: number;
}

export interface RoleBucket {
  category: "Leadership" | "Business" | "Technical" | "Same role";
  percentage: number;
  topRoles: string[];  // 2-3 example role names
}

export interface InsightsData {
  topDestinations: TopDestination[];  // max 5
  roleBuckets: RoleBucket[];          // non-empty buckets only, sorted by %
  patternSummary: string;             // 2-3 sentences
  totalMigrations: number;
}

export function computeInsights(
  migrations: MigrationRecord[],
  searchedRole: string,
): InsightsData { ... }
```

```typescript
// In ResultsDashboard -- follows existing useMemo pattern
const insights = useMemo(
  () => computeInsights(migrations, search.role),
  [migrations, search.role],
);
```

### Pattern 2: Keyword-Based Role Classification
**What:** Classify destination roles into 4 buckets using keyword matching against the role title string.
**When to use:** For INSI-02 career path grouping.
**Example:**
```typescript
type RoleCategory = "Leadership" | "Business" | "Technical" | "Same role";

const ROLE_KEYWORDS: Record<Exclude<RoleCategory, "Same role">, RegExp> = {
  Leadership: /\b(vp|vice president|director|head of|chief|ceo|cto|cfo|coo|cmo|svp|evp|president|managing director|general manager|partner)\b/i,
  Business: /\b(pm|product manager|sales|account executive|ae|success|marketing|business development|bdr|sdr|recruiter|hr|people|operations|finance|analyst|consultant|strategy)\b/i,
  Technical: /\b(engineer|developer|architect|sre|devops|data scientist|ml|machine learning|security|infrastructure|platform|backend|frontend|fullstack|full stack|qa|test)\b/i,
};

function classifyRole(destinationRole: string, searchedRole: string): RoleCategory {
  // Check "Same role" first via normalized title fuzzy match
  const normalizedDest = normalizeRoleTitle(destinationRole).toLowerCase();
  const normalizedSearch = normalizeRoleTitle(searchedRole).toLowerCase();
  if (normalizedDest === normalizedSearch || normalizedDest.includes(normalizedSearch) || normalizedSearch.includes(normalizedDest)) {
    return "Same role";
  }

  // Then check keyword buckets in priority order
  for (const [category, pattern] of Object.entries(ROLE_KEYWORDS)) {
    if (pattern.test(destinationRole)) {
      return category as RoleCategory;
    }
  }

  // Default: if no keywords match, check if it's similar enough to source
  return "Business"; // or could go to a generic "Other" -- but CONTEXT says 4 buckets only
}
```

### Pattern 3: Template-Based Pattern Summary Generation
**What:** Detect the most notable pattern from computed data and generate 2-3 sentences using string templates.
**When to use:** For INSI-03.
**Example:**
```typescript
interface PatternSignal {
  type: "concentration" | "role_change" | "top_transition" | "seniority_trend";
  score: number;  // How "notable" this pattern is (higher = more interesting)
  text: string;   // The generated sentence
}

function detectPatterns(
  topDestinations: TopDestination[],
  roleBuckets: RoleBucket[],
  migrations: MigrationRecord[],
  searchedRole: string,
): PatternSignal[] {
  const signals: PatternSignal[] = [];

  // Concentration: Is there a dominant destination?
  if (topDestinations.length > 0 && topDestinations[0].percentage >= 25) {
    signals.push({
      type: "concentration",
      score: topDestinations[0].percentage,
      text: `${topDestinations[0].percentage}% of leavers went to ${topDestinations[0].company}, making it the dominant destination.`,
    });
  }

  // ... more patterns ...

  // Sort by score descending -- lead with most notable
  return signals.sort((a, b) => b.score - a.score);
}
```

### Anti-Patterns to Avoid
- **Computation in components:** Never put aggregation logic directly in JSX or render functions. All computation in `src/lib/insights.ts`.
- **Hardcoded thresholds without constants:** Use named constants (e.g., `CONCENTRATION_THRESHOLD = 25`) so thresholds are tunable.
- **Showing 0% buckets:** User explicitly said to hide empty categories.
- **Raw counts in top destinations:** User explicitly chose percentages only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Company aggregation | Custom grouping | Reuse logic from `groupMigrationsForCards()` | Already computes company totals sorted by count |
| Role normalization | Custom string parsing | `normalizeRoleTitle()` from `seniority.ts` | Handles Sr., Junior, Director of, etc. |
| Seniority level parsing | Custom level detection | `parseSeniorityLevel()` from `seniority.ts` | Already maps keywords to 0-9 scale |
| Card UI | Custom div layouts | shadcn `Card`, `CardHeader`, `CardContent` | Already available in `src/components/ui/card.tsx` |

**Key insight:** This phase is almost entirely about composing existing utilities into new derived computations. The data transformation primitives are already built.

## Common Pitfalls

### Pitfall 1: Division by Zero with Empty Results
**What goes wrong:** Computing percentages when `totalMigrations` is 0 produces NaN.
**Why it happens:** Edge case when no migration records match the search.
**How to avoid:** Guard all percentage calculations: `totalMigrations > 0 ? (count / totalMigrations) * 100 : 0`. Return early from `computeInsights()` with a sentinel empty state when migrations array is empty.
**Warning signs:** NaN or Infinity appearing in the UI.

### Pitfall 2: Role Classification Ambiguity
**What goes wrong:** A role like "Director of Engineering" matches both Leadership (Director) and Technical (Engineering).
**Why it happens:** Keywords from multiple buckets appear in the same title.
**How to avoid:** Check keywords in priority order: Same role first, then Leadership, then Technical, then Business. Leadership titles typically override the functional area because the person is in a leadership track regardless of domain.
**Warning signs:** Unexpected bucket percentages that don't match intuition.

### Pitfall 3: Percentage Rounding Not Summing to 100%
**What goes wrong:** Individual percentages display as 33%, 33%, 33% instead of summing to ~100%.
**Why it happens:** Standard `Math.round()` on individual values.
**How to avoid:** For top destinations, this is fine since it's top 5 out of potentially many companies (won't sum to 100). For role buckets, consider rounding to nearest integer and accepting minor variance. Don't try to force-sum to 100%.
**Warning signs:** Users confused by numbers that seem off.

### Pitfall 4: "Same Role" Over-Matching
**What goes wrong:** Too many roles classified as "Same role" because of broad substring matching.
**Why it happens:** Using `.includes()` too loosely -- e.g., "Engineer" matches "Sales Engineer", "Support Engineer", etc.
**How to avoid:** Use normalized titles for comparison and require a tighter match. The normalized search role should be the base comparison, and only exact normalized matches or very close variants should count as "Same role".
**Warning signs:** "Same role" bucket being unexpectedly large.

### Pitfall 5: Small Result Sets (<5 migrations)
**What goes wrong:** Insights feel meaningless -- "100% went to Company X" when there's only 1 record.
**Why it happens:** Percentages are misleading with tiny sample sizes.
**How to avoid:** Set a minimum threshold (e.g., 3-5 migrations) below which the insights card either shows a caveat message or reduces to a simpler display. This is in Claude's discretion per CONTEXT.md.
**Warning signs:** Insights that feel absurdly specific or confident based on 1-2 data points.

## Code Examples

### Computing Top Destinations (INSI-01)
```typescript
// Derives from the same data groupMigrationsForCards uses
export function computeTopDestinations(
  migrations: MigrationRecord[],
  limit: number = 5,
): TopDestination[] {
  const totalCount = migrations.reduce((sum, m) => sum + m.count, 0);
  if (totalCount === 0) return [];

  const companyTotals = new Map<string, number>();
  for (const m of migrations) {
    companyTotals.set(
      m.destinationCompany,
      (companyTotals.get(m.destinationCompany) ?? 0) + m.count,
    );
  }

  return [...companyTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([company, count]) => ({
      company,
      percentage: Math.round((count / totalCount) * 100),
    }));
}
```

### Role Bucket Classification (INSI-02)
```typescript
export function computeRoleBuckets(
  migrations: MigrationRecord[],
  searchedRole: string,
): RoleBucket[] {
  const totalCount = migrations.reduce((sum, m) => sum + m.count, 0);
  if (totalCount === 0) return [];

  const buckets = new Map<RoleCategory, { count: number; roles: Map<string, number> }>();

  for (const m of migrations) {
    const category = classifyRole(m.destinationRole, searchedRole);
    const bucket = buckets.get(category) ?? { count: 0, roles: new Map() };
    bucket.count += m.count;
    bucket.roles.set(
      m.destinationRole,
      (bucket.roles.get(m.destinationRole) ?? 0) + m.count,
    );
    buckets.set(category, bucket);
  }

  return [...buckets.entries()]
    .map(([category, { count, roles }]) => ({
      category,
      percentage: Math.round((count / totalCount) * 100),
      topRoles: [...roles.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([role]) => role),
    }))
    .filter((b) => b.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
}
```

### Integration in ResultsDashboard
```typescript
// In results-dashboard.tsx -- add between ResultsHeader and SankeyErrorBoundary
const insights = useMemo(
  () => computeInsights(migrations, search.role),
  [migrations, search.role],
);

return (
  <div className="space-y-8">
    <ResultsHeader ... />

    {migrations.length > 0 && <InsightsCard insights={insights} />}

    {migrations.length > 0 && (
      <SankeyErrorBoundary>
        <SankeyDiagram ... />
      </SankeyErrorBoundary>
    )}
    ...
  </div>
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLM-powered summaries | Template-based generation | User decision | Zero cost, zero latency, deterministic output |
| Weighted seniority ranking | Pure headcount ranking | User decision | Simpler, more intuitive for v1 |

**Deprecated/outdated:**
- None applicable -- this phase uses only existing stable patterns.

## Open Questions

1. **Default bucket for unclassifiable roles**
   - What we know: 4 buckets (Leadership/Business/Technical/Same role) are locked
   - What's unclear: What happens if a role title matches none of the keyword lists and isn't the same as the searched role? (e.g., "Photographer", "Chef")
   - Recommendation: Default to "Business" as the catch-all bucket since it's the broadest category, or consider a small "Other" text in the Business bucket. Since this is Claude's discretion, recommend defaulting to the most populated non-Leadership bucket to avoid skewing.

2. **Seniority trend data availability**
   - What we know: Pattern type 4 (seniority trend) requires seniority comparison data
   - What's unclear: `MigrationRecord` has `sourceRole` but the destination role seniority vs source role seniority comparison isn't pre-computed at the insights level
   - Recommendation: Use `parseSeniorityLevel()` on both `sourceRole` and `destinationRole` for each migration to compute the seniority distribution. This is straightforward since the utility already exists.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INSI-01 | Top 5 destinations with percentages | unit | `npx vitest run src/lib/__tests__/insights.test.ts` | No -- Wave 0 |
| INSI-02 | Role classification into 4 buckets | unit | `npx vitest run src/lib/__tests__/insights.test.ts` | No -- Wave 0 |
| INSI-03 | Pattern summary generation | unit | `npx vitest run src/lib/__tests__/insights.test.ts` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/insights.test.ts` -- covers INSI-01, INSI-02, INSI-03
- No framework install needed -- vitest already configured and working

## Sources

### Primary (HIGH confidence)
- Project source code: `src/lib/sankey-data.ts`, `src/lib/seniority.ts`, `src/components/results/results-dashboard.tsx`
- Project CONTEXT.md: User decisions for Phase 3
- Existing test patterns: `src/lib/__tests__/seniority.test.ts`

### Secondary (MEDIUM confidence)
- shadcn Card component already in `src/components/ui/card.tsx`

### Tertiary (LOW confidence)
- None -- all findings based on direct code inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing
- Architecture: HIGH -- follows established project patterns exactly
- Pitfalls: HIGH -- standard data computation edge cases, well-understood
- Role classification: MEDIUM -- keyword lists will need iterative tuning based on real data

**Research date:** 2026-03-06
**Valid until:** Indefinite -- pure computation patterns don't go stale
