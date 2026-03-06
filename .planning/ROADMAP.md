# Roadmap: Leavers

## Overview

Leavers delivers career migration intelligence by first proving the data pipeline works (the highest-risk component), then making results user-facing, layering insights on top, and finally adding accounts and saved searches. Every phase delivers a coherent capability that can be verified independently. The data pipeline is phase 1 because if we can't reliably fetch and normalize career migration data, nothing else matters.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Data Pipeline** - Project scaffolding, data sourcing, fuzzy matching, caching, and a working search form
- [x] **Phase 2: Results & Visualization** - Migration dashboard showing where people went, in what roles, with flow visualization (completed 2026-03-06)
- [x] **Phase 3: Insights** - Pattern analysis layer that surfaces the "aha moment" from raw migration data (completed 2026-03-06)
- [ ] **Phase 4: Auth, Saved Searches & Compliance** - User accounts, persistent saved searches, rate limiting, and legal pages

## Phase Details

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
**Plans:** 3 plans

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
**Plans:** 3/3 plans complete

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
**Plans:** 2/2 plans complete

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
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Pipeline | 3/3 | Complete | 2026-03-06 |
| 2. Results & Visualization | 3/3 | Complete   | 2026-03-06 |
| 3. Insights | 2/2 | Complete | 2026-03-06 |
| 4. Auth, Saved Searches & Compliance | 0/3 | Not started | - |
