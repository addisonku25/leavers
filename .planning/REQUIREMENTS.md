# Requirements: Leavers

**Defined:** 2026-03-06
**Core Value:** Show users concrete evidence of where people like them ended up — turning career anxiety into actionable intelligence.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Pipeline

- [ ] **DATA-01**: User can search by company name and role title
- [ ] **DATA-02**: App fuzzy-matches role titles across abbreviations, synonyms, and seniority levels (e.g. "Sr. Solutions Engineer" matches "Solution Engineer", "SE", "Sales Engineer")
- [ ] **DATA-03**: App fetches career migration data on-demand from external data APIs on first search
- [ ] **DATA-04**: Results are cached with 30-day TTL so repeat queries return instantly
- [ ] **DATA-05**: Data provider is abstracted behind an interface so sources can be swapped without rewrite

### Search & Results

- [ ] **SRCH-01**: User sees a search form with company and role input fields
- [ ] **SRCH-02**: User sees destination companies grouped with migration counts (e.g. "5 people went to Salesforce")
- [ ] **SRCH-03**: User sees what roles former employees moved into at each destination company
- [ ] **SRCH-04**: User sees a loading/processing state while on-demand data is being fetched
- [ ] **SRCH-05**: User sees a helpful empty state when no results are found
- [ ] **SRCH-06**: User sees a Sankey/flow visualization of career migration paths

### Insights

- [ ] **INSI-01**: User sees a ranked list of top destination companies
- [ ] **INSI-02**: User sees common role transitions (what roles people moved into)
- [ ] **INSI-03**: User sees pattern summaries (e.g. "People from your role tend to land at these 5 companies, especially in these roles")

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and stay logged in across sessions
- [ ] **AUTH-03**: User can log out

### Saved Searches

- [ ] **SAVE-01**: Authenticated user can save a search for later
- [ ] **SAVE-02**: Authenticated user can view their saved searches
- [ ] **SAVE-03**: Authenticated user can delete a saved search

### Privacy & Compliance

- [ ] **PRIV-01**: App displays only aggregated/anonymized data — no individual names or identifiable profiles
- [ ] **PRIV-02**: App rate-limits searches to prevent abuse
- [ ] **PRIV-03**: App includes terms of service and privacy policy pages

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
| Individual profile display | Privacy/legal risk — aggregated data is both safer and more useful |
| Real-time chat/networking | Not a social tool — focused on data discovery |
| Job application tracking | Focused on discovery, not workflow management |
| Mobile native app | Web-first; responsive design handles mobile |
| LinkedIn OAuth login | Adds complexity and LinkedIn dependency for minimal gain |
| ML-based semantic role matching | Fuse.js + synonym tables sufficient for v1; upgrade when real data shows gaps |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DATA-04 | — | Pending |
| DATA-05 | — | Pending |
| SRCH-01 | — | Pending |
| SRCH-02 | — | Pending |
| SRCH-03 | — | Pending |
| SRCH-04 | — | Pending |
| SRCH-05 | — | Pending |
| SRCH-06 | — | Pending |
| INSI-01 | — | Pending |
| INSI-02 | — | Pending |
| INSI-03 | — | Pending |
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| SAVE-01 | — | Pending |
| SAVE-02 | — | Pending |
| SAVE-03 | — | Pending |
| PRIV-01 | — | Pending |
| PRIV-02 | — | Pending |
| PRIV-03 | — | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 0
- Unmapped: 23 ⚠️

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after initial definition*
