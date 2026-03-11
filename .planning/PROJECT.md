# Leavers

## What This Is

A web app that shows users where people with similar roles at their company have gone next. Users search by company + role, and the app returns career migration patterns: destination companies, roles, flow visualizations, and actionable insights. Users can drill into individual leaver details with career timelines, auth-gated behind sign-up.

## Core Value

Show users concrete evidence of where people like them ended up -- turning career anxiety into actionable intelligence.

## Requirements

### Validated

- User can input current role and company to search for career migration patterns -- v1.0
- App fuzzy-matches role titles (e.g. "Senior Solution Engineer" matches "Solutions Engineer", "Sr. SE", etc.) -- v1.0
- App finds individuals who previously held similar roles at the specified company -- v1.0
- Dashboard displays destination companies grouped with counts (e.g. "5 people went to Salesforce") -- v1.0
- Dashboard shows what roles former employees moved into at each destination company -- v1.0
- Insights layer surfaces patterns (e.g. "People from your role tend to land at these 5 companies, especially in these roles") -- v1.0
- On-demand data fetching -- first search runs live, results are cached for subsequent users -- v1.0
- Basic search works without an account -- v1.0
- Accounts unlock saved searches and future premium features -- v1.0
- Data sourced from LinkedIn/Indeed via APIs where available, scraping as fallback -- v1.0
- Hosted on Vercel with GitHub, Turso, and Cloudflare as needed -- v1.0
- Sankey company node click scrolls to cards, highlights and promotes matching card to top -- v1.1
- Sankey role node click filters/highlights cards containing that role, promotes them to top -- v1.1
- Roles in company cards are visually clickable (button/link style) -- v1.1
- Clicking a role opens a modal with individual leaver details -- v1.1
- Leaver detail shows transition date and full career history -- v1.1
- Leaver detail shows name and LinkedIn link for authenticated users only -- v1.1
- Data model expanded to store individual leaver details (career history, dates, LinkedIn URL) -- v1.1
- Bidirectional sync between company cards and Sankey diagram nodes -- v1.1

### Active

(None -- next milestone requirements TBD)

### Out of Scope

- AI resume comparison -- deferred to v2 after core search/insights are validated
- Real-time chat or social features -- not a networking tool
- Mobile native app -- web-first
- Job application tracking -- focused on discovery, not workflow
- LinkedIn OAuth login -- adds complexity and LinkedIn dependency for minimal gain
- ML-based semantic role matching -- Fuse.js + synonym tables sufficient; upgrade when real data shows gaps

## Context

- Target audience: professionals exploring career moves, especially those unsure what companies value their current experience
- The "aha moment" is the insight -- not just a list of names, but patterns about where people like you end up
- Fuzzy role matching is critical because job titles vary wildly across companies
- Data freshness strategy: on-demand (live fetch on first search, cached for future queries)
- LinkedIn is the primary data source; Indeed as supplementary
- Monetization TBD -- freemium is likely if the product proves valuable
- Shipped v1.0 + v1.1 with 8,717 LOC TypeScript across 8 phases (20 plans)
- Tech stack: Next.js 16, React 19, Tailwind v4, shadcn/ui, Turso/Drizzle, Upstash Redis, Better Auth, d3-sankey, motion/react, Fuse.js
- 200 tests passing across 21 test files

## Constraints

- **Data access**: LinkedIn heavily restricts scraping and API access -- BrightData People Profile requires LinkedIn URLs as input (no discovery mechanism yet)
- **Hosting**: Must use existing accounts (GitHub, Vercel, Turso, Cloudflare)
- **Privacy**: Individual career data auth-gated; PII stripped server-side for unauthenticated users
- **Vercel limits**: Free tier 10-second timeout may be insufficient for on-demand data fetching

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| On-demand + cache data strategy | Balances freshness with cost -- first search is slower, subsequent are instant | Good |
| Fuzzy role matching (Fuse.js + synonyms) | Job titles vary too much for exact match to be useful | Good |
| Flexible auth (open search + accounts for features) | Reduces friction for first use while enabling premium features later | Good |
| v2 for resume AI | Core value is the migration data/insights -- resume comparison adds complexity without validating the premise | Pending |
| FK to migrations (not searches) for leavers | Modal opens from company card role which maps 1:1 to migration record | Good |
| Text columns for dates | LinkedIn dates are fuzzy (e.g. 2024-03), not precise timestamps | Good |
| Redis caches only aggregate data | Leaver PII stays in Turso only -- never cached in Redis | Good |
| DrillDownProvider (Context + useReducer) | Cross-component selection state for Sankey/card interactions without prop drilling | Good |
| Server-side PII stripping | Never send name/LinkedIn to unauthenticated clients -- fields omitted entirely, not nulled | Good |
| motion/react for layout animations | Card position animations via layout prop instead of manual CSS transitions | Good |
| Optional nodeIndex in DrillDownAction | Cards dispatch without knowing Sankey node index; Sankey resolves from layout | Good |

---
*Last updated: 2026-03-11 after v1.1 milestone completion*
