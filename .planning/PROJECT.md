# Leavers

## What This Is

A web app that shows users where people with similar roles at their company have gone next. Users input their current role and company, and the app finds former employees who held that role, revealing which companies they moved to and what roles they took. It's direct proof that your experience qualifies you for specific opportunities.

## Core Value

Show users concrete evidence of where people like them ended up — turning career anxiety into actionable intelligence.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can input current role and company to search for career migration patterns
- [ ] App fuzzy-matches role titles (e.g. "Senior Solution Engineer" matches "Solutions Engineer", "Sr. SE", etc.)
- [ ] App finds individuals who previously held similar roles at the specified company
- [ ] Dashboard displays destination companies grouped with counts (e.g. "5 people went to Salesforce")
- [ ] Dashboard shows what roles former employees moved into at each destination company
- [ ] Insights layer surfaces patterns (e.g. "People from your role tend to land at these 5 companies, especially in these roles")
- [ ] On-demand data fetching — first search runs live, results are cached for subsequent users
- [ ] Basic search works without an account
- [ ] Accounts unlock saved searches and future premium features
- [ ] Data sourced from LinkedIn/Indeed via APIs where available, scraping as fallback
- [ ] Hosted on Vercel with GitHub, Turso, and Cloudflare as needed

### Out of Scope

- AI resume comparison — deferred to v2 after core search/insights are validated
- Real-time chat or social features — not a networking tool
- Mobile native app — web-first
- Job application tracking — focused on discovery, not workflow

## Context

- Target audience: professionals exploring career moves, especially those unsure what companies value their current experience
- The "aha moment" is the insight — not just a list of names, but patterns about where people like you end up
- Fuzzy role matching is critical because job titles vary wildly across companies (Solution Engineer vs Solutions Engineer vs SE vs Sales Engineer)
- Data freshness strategy: on-demand (live fetch on first search, cached for future queries) balances cost with usefulness
- LinkedIn is the primary data source; Indeed as supplementary. API access preferred, scraping as fallback — need to research what's actually available
- Monetization TBD — freemium is likely if the product proves valuable

## Constraints

- **Data access**: LinkedIn heavily restricts scraping and API access — this is the biggest technical risk
- **Hosting**: Must use existing accounts (GitHub, Vercel, Turso, Cloudflare)
- **Privacy**: Displaying publicly available career data, but need to be thoughtful about how individuals are presented

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| On-demand + cache data strategy | Balances freshness with cost — first search is slower, subsequent are instant | — Pending |
| Fuzzy role matching | Job titles vary too much for exact match to be useful | — Pending |
| Flexible auth (open search + accounts for features) | Reduces friction for first use while enabling premium features later | — Pending |
| v2 for resume AI | Core value is the migration data/insights — resume comparison adds complexity without validating the premise | — Pending |

---
*Last updated: 2026-03-06 after initialization*
