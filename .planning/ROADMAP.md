# Roadmap: Leavers

## Milestones

- v1.0 MVP - Phases 1-4 (shipped 2026-03-06)
- v1.1 Deep Dive - Phases 5-8 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-03-06</summary>

- [x] **Phase 1: Foundation & Data Pipeline** - Project scaffolding, data sourcing, fuzzy matching, caching, and a working search form
- [x] **Phase 2: Results & Visualization** - Migration dashboard showing where people went, in what roles, with flow visualization
- [x] **Phase 3: Insights** - Pattern analysis layer that surfaces the "aha moment" from raw migration data
- [x] **Phase 4: Auth, Saved Searches & Compliance** - User accounts, persistent saved searches, rate limiting, and legal pages

### Phase 1: Foundation & Data Pipeline
**Goal**: User can search by company and role and receive normalized, cached career migration data
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, SRCH-01, SRCH-04
**Success Criteria** (what must be TRUE):
  1. User can enter a company name and role title into a search form and submit a query
  2. App returns career migration results with fuzzy-matched role titles (e.g. "Sr. SE" matches "Solutions Engineer")
  3. First search fetches data live from external API; repeating the same search returns cached results near-instantly
  4. User sees a loading/progress indicator while on-demand data is being fetched
  5. Data provider can be swapped without changing application code (abstracted behind interface)
**Plans:** 3/3 complete

Plans:
- [x] 01-01-PLAN.md — Scaffold project, build data pipeline core (types, providers, cache, fuzzy matching)
- [x] 01-02-PLAN.md — Validate ScrapIn API, implement BrightData+ScrapIn providers, wire search server action
- [x] 01-03-PLAN.md — Build search UI (landing page, form, suggestions, results page, loading/error states)

### Phase 2: Results & Visualization
**Goal**: User sees a clear, anonymized dashboard of where former employees went and what roles they took
**Depends on**: Phase 1
**Requirements**: SRCH-02, SRCH-03, SRCH-05, SRCH-06, PRIV-01
**Success Criteria** (what must be TRUE):
  1. User sees destination companies grouped with migration counts (e.g. "5 people went to Salesforce")
  2. User sees what roles former employees moved into at each destination company
  3. User sees a Sankey/flow visualization of career migration paths
  4. User sees a helpful empty state with guidance when no results are found
  5. All displayed data is aggregated and anonymized -- no individual names or identifiable profiles appear anywhere
**Plans:** 3/3 complete

Plans:
- [x] 02-01-PLAN.md — Schema migration (add sourceRole), seniority parsing, data transformation layer (card grouping + Sankey data builder)
- [x] 02-02-PLAN.md — Results dashboard UI (summary header, company cards grid, role list with seniority dots, polished empty state)
- [x] 02-03-PLAN.md — Sankey flow visualization (d3-sankey + React SVG, hover interactions, error boundary, responsive)

### Phase 3: Insights
**Goal**: User gets actionable pattern analysis that transforms raw migration data into career intelligence
**Depends on**: Phase 2
**Requirements**: INSI-01, INSI-02, INSI-03
**Success Criteria** (what must be TRUE):
  1. User sees a ranked list of top destination companies for their search
  2. User sees common role transitions showing what roles people moved into
  3. User sees natural-language pattern summaries (e.g. "People from your role tend to land at these 5 companies, especially in these roles")
**Plans:** 2/2 complete

Plans:
- [x] 03-01-PLAN.md — Insights computation engine (TDD): top destinations, role classification, pattern summary generation
- [x] 03-02-PLAN.md — InsightsCard component + ResultsDashboard integration

### Phase 4: Auth, Saved Searches & Compliance
**Goal**: Users can create accounts to save searches, and the app is hardened with rate limiting and legal compliance
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, SAVE-01, SAVE-02, SAVE-03, PRIV-02, PRIV-03
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password, log in, and stay logged in across browser sessions
  2. User can log out from any page
  3. Authenticated user can save a search, view their saved searches, and delete a saved search
  4. Unauthenticated users are rate-limited to prevent abuse of the search API
  5. App includes accessible terms of service and privacy policy pages
**Plans:** 5/5 complete

Plans:
- [x] 04-00-PLAN.md — Wave 0: Test stubs for all Phase 4 verification targets (Nyquist contract)
- [x] 04-01-PLAN.md — Better Auth setup (schema, config, route handler), login/signup pages, persistent nav bar
- [x] 04-02-PLAN.md — Terms of service and privacy policy pages, persistent footer
- [x] 04-03-PLAN.md — Rate limiting (Upstash) for search and auth endpoints
- [x] 04-04-PLAN.md — Saved searches (server actions, save button, /saved page, auto-save flow)

</details>

### v1.1 Deep Dive

**Milestone Goal:** Add interactive drill-down from Sankey diagram and company cards into individual leaver details, turning aggregate patterns into auditable evidence.

- [ ] **Phase 5: Data Model Expansion** - New leavers table, extended types, and mock provider for individual career data
- [ ] **Phase 6: Sankey Click Interactions** - Click-to-scroll, highlight, filter, and toggle between Sankey diagram and company cards
- [ ] **Phase 7: Leaver Detail Modal** - Clickable roles opening auth-gated modal with individual career histories
- [ ] **Phase 8: Polish & Bidirectional Sync** - Card-to-Sankey highlighting and interaction refinements

## Phase Details

### Phase 5: Data Model Expansion
**Goal**: Individual leaver records with career histories are stored and retrievable, enabling downstream drill-down features
**Depends on**: Phase 4
**Requirements**: DMOD-01, DMOD-02, DMOD-03, DMOD-04
**Success Criteria** (what must be TRUE):
  1. A new leavers table exists with records linked to migrations, storing per-person career data
  2. Leaver records include structured career history (positions with company, title, and dates)
  3. DataProvider interface has an optional searchDetailed method that returns individual leaver data alongside aggregated results
  4. Mock provider returns deterministic individual leaver data for any search query in development
**Plans**: TBD

### Phase 6: Sankey Click Interactions
**Goal**: Users can click Sankey diagram nodes to navigate, filter, and highlight the company card grid
**Depends on**: Phase 4 (uses existing Sankey and company card components)
**Requirements**: SANK-01, SANK-02, SANK-03, SANK-04
**Success Criteria** (what must be TRUE):
  1. User can click a company node in the Sankey diagram and the matching company card scrolls into view, highlights, and promotes to top of grid
  2. User can click a role node in the Sankey diagram and company cards containing that role filter to the top with the role highlighted
  3. Promoted and filtered cards animate smoothly to their new positions (no layout jumps)
  4. User can click the same node again to reset the filter/highlight state back to default
**Plans**: TBD

### Phase 7: Leaver Detail Modal
**Goal**: Users can drill from role names into individual leaver details, with personal information gated behind authentication
**Depends on**: Phase 5 (leaver data exists), Phase 6 (drill-down context for open/close triggers)
**Requirements**: LVRD-01, LVRD-02, LVRD-03, LVRD-04, LVRD-05, LVRD-06, PRIV-04, PRIV-05
**Success Criteria** (what must be TRUE):
  1. Roles in company cards are visually distinct as clickable elements (button or link style)
  2. Clicking a role opens a modal listing individual leavers who made that specific transition
  3. Each leaver in the modal shows their transition date and full career history as a timeline
  4. Authenticated users see leaver names and LinkedIn profile links; unauthenticated users see blurred placeholders with a sign-up call-to-action
  5. Individual leaver data loads on modal open (not during initial search), and PII is stripped server-side before reaching unauthenticated clients
**Plans**: TBD

### Phase 8: Polish & Bidirectional Sync
**Goal**: Company cards and Sankey diagram stay visually synced in both directions for a cohesive drill-down experience
**Depends on**: Phase 7
**Requirements**: SANK-05
**Success Criteria** (what must be TRUE):
  1. Clicking a company card highlights the corresponding company node in the Sankey diagram
  2. The highlight syncs bidirectionally -- clicking either side updates the other, and clearing one clears both
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Data Pipeline | v1.0 | 3/3 | Complete | 2026-03-06 |
| 2. Results & Visualization | v1.0 | 3/3 | Complete | 2026-03-06 |
| 3. Insights | v1.0 | 2/2 | Complete | 2026-03-06 |
| 4. Auth, Saved Searches & Compliance | v1.0 | 5/5 | Complete | 2026-03-06 |
| 5. Data Model Expansion | v1.1 | 0/0 | Not started | - |
| 6. Sankey Click Interactions | v1.1 | 0/0 | Not started | - |
| 7. Leaver Detail Modal | v1.1 | 0/0 | Not started | - |
| 8. Polish & Bidirectional Sync | v1.1 | 0/0 | Not started | - |
