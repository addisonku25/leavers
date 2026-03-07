# Requirements: Leavers

**Defined:** 2026-03-06
**Core Value:** Show users concrete evidence of where people like them ended up -- turning career anxiety into actionable intelligence.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Pipeline

- [x] **DATA-01**: User can search by company name and role title
- [x] **DATA-02**: App fuzzy-matches role titles across abbreviations, synonyms, and seniority levels (e.g. "Sr. Solutions Engineer" matches "Solution Engineer", "SE", "Sales Engineer")
- [x] **DATA-03**: App fetches career migration data on-demand from external data APIs on first search
- [x] **DATA-04**: Results are cached with 30-day TTL so repeat queries return instantly
- [x] **DATA-05**: Data provider is abstracted behind an interface so sources can be swapped without rewrite

### Search & Results

- [x] **SRCH-01**: User sees a search form with company and role input fields
- [x] **SRCH-02**: User sees destination companies grouped with migration counts (e.g. "5 people went to Salesforce")
- [x] **SRCH-03**: User sees what roles former employees moved into at each destination company
- [x] **SRCH-04**: User sees a loading/processing state while on-demand data is being fetched
- [x] **SRCH-05**: User sees a helpful empty state when no results are found
- [x] **SRCH-06**: User sees a Sankey/flow visualization of career migration paths

### Insights

- [x] **INSI-01**: User sees a ranked list of top destination companies
- [x] **INSI-02**: User sees common role transitions (what roles people moved into)
- [x] **INSI-03**: User sees pattern summaries (e.g. "People from your role tend to land at these 5 companies, especially in these roles")

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in and stay logged in across sessions
- [x] **AUTH-03**: User can log out

### Saved Searches

- [x] **SAVE-01**: Authenticated user can save a search for later
- [x] **SAVE-02**: Authenticated user can view their saved searches
- [x] **SAVE-03**: Authenticated user can delete a saved search

### Privacy & Compliance

- [x] **PRIV-01**: App displays only aggregated/anonymized data -- no individual names or identifiable profiles
- [x] **PRIV-02**: App rate-limits searches to prevent abuse
- [x] **PRIV-03**: App includes terms of service and privacy policy pages

## v1.1 Requirements

Requirements for Deep Dive milestone. Continues from v1 numbering.

### Sankey Interactions

- [ ] **SANK-01**: User can click a company node in the Sankey diagram to scroll to and highlight the matching company card, promoted to top
- [ ] **SANK-02**: User can click a role node in the Sankey diagram to filter company cards to those containing that role, promoted to top with role highlighted
- [ ] **SANK-03**: Promoted/filtered cards animate smoothly to their new positions (CSS transitions)
- [ ] **SANK-04**: User can click again to reset the filter/highlight state
- [ ] **SANK-05**: Clicking a company card highlights the corresponding node in the Sankey diagram (bidirectional sync)

### Leaver Details

- [ ] **LVRD-01**: Roles in company cards are visually clickable (button/link style)
- [ ] **LVRD-02**: Clicking a role opens a modal showing individual leavers who made that transition
- [ ] **LVRD-03**: Leaver modal shows transition date and full career history for each leaver
- [ ] **LVRD-04**: Leaver modal shows name and LinkedIn profile link for authenticated users only
- [ ] **LVRD-05**: Unauthenticated users see blurred name/LinkedIn with sign-up CTA overlay
- [ ] **LVRD-06**: Individual leaver data is stored during initial search (BrightData already returns it)

### Data Model

- [x] **DMOD-01**: New leavers table stores individual leaver records linked to migrations
- [x] **DMOD-02**: Leaver records include career history (positions with company, title, dates)
- [x] **DMOD-03**: DataProvider interface extended with optional searchDetailed method for per-person data
- [ ] **DMOD-04**: Mock provider returns deterministic individual leaver data for development

### Privacy Update

- [ ] **PRIV-04**: Privacy policy updated to cover display of individual career data with auth-gating
- [ ] **PRIV-05**: Auth-gated PII (name, LinkedIn URL) is stripped server-side before reaching unauthenticated clients

## v2 Requirements

### Resume AI

- **RSAI-01**: User can upload their resume
- **RSAI-02**: App compares user's resume framing to patterns from successful leavers
- **RSAI-03**: App recommends how to frame Company A experience for target companies

### Growth Features

- **GROW-01**: User receives email alerts when new migration data appears for saved searches
- **GROW-02**: User can view search history
- **GROW-03**: App pre-seeds popular company/role combinations for instant results
- **GROW-04**: Results display company logos

### Advanced Insights

- **ADVI-01**: User sees tenure data (how long people stayed before leaving)
- **ADVI-02**: User sees industry/sector breakdown of destination companies
- **ADVI-03**: User can share results via a public link or shareable card

## Out of Scope

| Feature | Reason |
|---------|--------|
| Individual profile display (unauthenticated) | Auth-gated in v1.1 -- PII visible only to signed-in users |
| Real-time chat/networking | Not a social tool -- focused on data discovery |
| Job application tracking | Focused on discovery, not workflow management |
| Mobile native app | Web-first; responsive design handles mobile |
| LinkedIn OAuth login | Adds complexity and LinkedIn dependency for minimal gain |
| ML-based semantic role matching | Fuse.js + synonym tables sufficient for v1; upgrade when real data shows gaps |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| SRCH-01 | Phase 1 | Complete |
| SRCH-02 | Phase 2 | Complete |
| SRCH-03 | Phase 2 | Complete |
| SRCH-04 | Phase 1 | Complete |
| SRCH-05 | Phase 2 | Complete |
| SRCH-06 | Phase 2 | Complete |
| INSI-01 | Phase 3 | Complete |
| INSI-02 | Phase 3 | Complete |
| INSI-03 | Phase 3 | Complete |
| AUTH-01 | Phase 4 | Complete |
| AUTH-02 | Phase 4 | Complete |
| AUTH-03 | Phase 4 | Complete |
| SAVE-01 | Phase 4 | Complete |
| SAVE-02 | Phase 4 | Complete |
| SAVE-03 | Phase 4 | Complete |
| PRIV-01 | Phase 2 | Complete |
| PRIV-02 | Phase 4 | Complete |
| PRIV-03 | Phase 4 | Complete |
| SANK-01 | Phase 6 | Pending |
| SANK-02 | Phase 6 | Pending |
| SANK-03 | Phase 6 | Pending |
| SANK-04 | Phase 6 | Pending |
| SANK-05 | Phase 8 | Pending |
| LVRD-01 | Phase 7 | Pending |
| LVRD-02 | Phase 7 | Pending |
| LVRD-03 | Phase 7 | Pending |
| LVRD-04 | Phase 7 | Pending |
| LVRD-05 | Phase 7 | Pending |
| LVRD-06 | Phase 7 | Pending |
| DMOD-01 | Phase 5 | Complete |
| DMOD-02 | Phase 5 | Complete |
| DMOD-03 | Phase 5 | Complete |
| DMOD-04 | Phase 5 | Pending |
| PRIV-04 | Phase 7 | Pending |
| PRIV-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 23 total, 23 mapped, 0 unmapped
- v1.1 requirements: 17 total, 17 mapped, 0 unmapped

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-07 after v1.1 roadmap creation*
