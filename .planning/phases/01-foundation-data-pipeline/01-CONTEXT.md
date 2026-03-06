# Phase 1: Foundation & Data Pipeline - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

User can search by company and role and receive normalized, cached career migration data. Includes project scaffolding, data sourcing via ScrapIn API, fuzzy role matching with Fuse.js, Redis/Turso caching, a working search form with loading states, and a dedicated results page. Results display/visualization and insights are Phase 2 and 3.

</domain>

<decisions>
## Implementation Decisions

### Search Form Experience
- Hero + search landing page: value prop headline, brief description, then search form below
- Two text inputs (company + role) with dropdown suggestions as user types
- Seed suggestions with ~100-200 popular companies (FAANG, consulting, banks, etc.) and common role titles; grow suggestions from past searches over time
- Search navigates to dedicated results page at `/results/[id]` — each search gets a unique URL (shareable later)

### Loading & Wait Experience
- Step-by-step progress indicators during live API fetch: named steps that check off as they complete ("Querying career data..." -> "Matching role titles..." -> "Aggregating results...")
- Include time expectation message: "This may take 10-20 seconds on first search"
- After 15 seconds, show "Taking longer than usual..." but keep waiting up to 60s (Vercel Pro limit)
- Cached search results show a brief shimmer/skeleton (~500ms) before displaying — prevents jarring instant transitions
- Do NOT show cache age or "results from X days ago" to users — keep it clean

### ScrapIn Validation Strategy
- Validate ScrapIn API FIRST before building any UI — write a test script that calls ScrapIn with a real company/role to see what data comes back
- Waterfall fallback plan: ScrapIn -> Bright Data -> mock/demo data (exhaust real data options before falling back)
- Sign up for ScrapIn pay-per-use ($1/1000 records) and run a small validation test
- If no paid API can answer "where did people go?", build with curated demo data to validate product concept

### Error & Empty States
- Empty results: helpful guidance with suggestions ("Try a broader role title", "Try a larger company", "Try a different spelling") + "Try Another Search" button
- API failure: honest error message ("Something went wrong fetching data. Please try again in a moment.") with retry button — no silent retry
- Low result counts (2-3 matches): show results normally, let users judge the data themselves
- Form validation: inline validation, both fields required, show error inline if empty on submit

### Claude's Discretion
- Exact hero section copy and visual design
- Loading step names and animation style
- Suggestion dropdown UI implementation details
- Seed company/role list curation approach
- Form field placeholder text and microcopy
- Error message exact wording

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project

### Established Patterns
- Stack decided: Next.js 15, React 19, TypeScript, Turso, Drizzle ORM, Upstash Redis, ScrapIn, Fuse.js, shadcn/ui, Tailwind CSS 4, Zod 4, React Hook Form, Biome
- Architecture decided: Cache-aside (Redis -> Turso -> API), provider adapter pattern, two-tier role matching
- Data model decided: `searches` + `migrations` tables with aggregated/anonymized data
- Project structure decided: `lib/data/providers/`, `lib/matching/`, `lib/cache/`, `actions/`, `components/`

### Integration Points
- Vercel deployment with GitHub auto-deploy
- Turso for persistent storage (local SQLite for dev)
- Upstash Redis for hot cache (HTTP-based, serverless)
- ScrapIn API for LinkedIn career data (pay-per-use)
- Cloudflare for DNS + CDN (proxy mode only)

</code_context>

<specifics>
## Specific Ideas

- Loading experience should feel like a flight search engine — transparent progress steps that build trust during the wait
- The search form IS the product's first impression — hero + search, not a cluttered landing page
- Suggestions should feel like Google search autocomplete — responsive, helpful, not overwhelming

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-data-pipeline*
*Context gathered: 2026-03-06*
