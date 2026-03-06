# Research Summary: Leavers

**Domain:** Career Migration Intelligence Web App
**Researched:** 2026-03-06
**Overall confidence:** MEDIUM

## Executive Summary

Leavers is a career intelligence tool that shows users where former employees with similar roles at their company ended up. The technical challenge sits at the intersection of three domains: on-demand data sourcing from LinkedIn (the hardest part), fuzzy text matching for inconsistent job titles, and a caching strategy that balances freshness with API costs.

The recommended stack centers on Next.js 15 deployed to Vercel, with Turso (libSQL) for persistent storage and Upstash Redis for caching. This aligns with Addison's existing accounts and provides a serverless-first architecture that scales from zero to significant traffic without ops burden. The data sourcing layer is the highest-risk component -- LinkedIn data access is inherently fragile, and the recommendation is to use ScrapIn API ($1/1,000 records) with Bright Data as a hot standby, abstracted behind a provider interface so swapping sources is trivial.

The fuzzy matching challenge is well-served by Fuse.js with a pre-normalization pipeline that expands abbreviations and standardizes seniority levels before fuzzy comparison. This is a solved problem technically, but requires domain-specific tuning with real job title data to get right.

The biggest strategic risk is building too much before validating that users want this data. The MVP should be ruthlessly minimal: search, results, caching. No auth, no insights engine, no visualizations. Prove the core value proposition first.

## Key Findings

**Stack:** Next.js 15 + Turso + Drizzle + Upstash Redis + Better Auth + ScrapIn API + shadcn/ui + Fuse.js

**Architecture:** Cache-aside pattern with dual storage (Redis for speed, Turso for permanence). On-demand scraping with progressive loading. Anonymized aggregation -- never store individual names.

**Critical pitfall:** LinkedIn data access fragility. The data source can disappear at any time (Proxycurl already shut down). Must abstract the data provider and cache aggressively.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation + Data Pipeline** - Build the core data flow first because everything depends on it
   - Addresses: Search input, ScrapIn integration, data normalization, fuzzy matching, caching
   - Avoids: Building UI polish before proving data pipeline works
   - This phase should include a manual "can I actually get useful data?" validation before writing any UI

2. **Search UI + Results Display** - Make the data pipeline user-facing
   - Addresses: Search form, results dashboard, migration destination list, role breakdowns
   - Avoids: Over-engineering the UI; keep it functional, not beautiful

3. **Auth + Saved Searches** - Add user identity only after core value is proven
   - Addresses: Better Auth integration, saved searches, rate limiting
   - Avoids: Building auth before proving value (Pitfall 8)

4. **Insights + Polish** - Add the "aha moment" layer
   - Addresses: Pattern insights, visualizations (Recharts), empty state UX, search suggestions
   - Avoids: Feature creep into ML/AI territory

**Phase ordering rationale:**
- Data pipeline MUST come first because the entire app is useless without working data access. If ScrapIn doesn't deliver useful career migration data, everything else is moot.
- UI comes second because it's the fastest way to get user feedback after the pipeline works.
- Auth is deferred because it adds friction and complexity without validating the premise.
- Insights come last because they're differentiators, not table stakes.

**Research flags for phases:**
- Phase 1: NEEDS DEEPER RESEARCH -- ScrapIn API capabilities need hands-on testing. Can it actually return "where did former employees of Company X with Role Y go?" or does it only return individual profile data that you have to aggregate yourself?
- Phase 2: Standard patterns, unlikely to need research
- Phase 3: Better Auth + Turso integration is well-documented but relatively new; may hit edge cases
- Phase 4: Standard patterns for aggregation and charting

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Well-established technologies, all verified with current docs |
| Features | HIGH | Clear from project requirements, straightforward feature set |
| Architecture | MEDIUM | Cache-aside + dual storage is proven, but ScrapIn API specifics need hands-on validation |
| Pitfalls | HIGH | Data access fragility is well-documented; privacy concerns are obvious; timeout issues are known |
| Data Sourcing | LOW | ScrapIn's actual capability to answer "where did people go?" vs just profile enrichment is unverified. This is the single biggest unknown. |

## Gaps to Address

- **ScrapIn API actual capabilities:** Can it answer the core question, or does it only do profile enrichment? Need to test with real API calls before committing architecture.
- **LinkedIn data structure:** What exactly does ScrapIn return? Past positions with dates? Company history? This determines the aggregation logic.
- **Legal review:** Displaying anonymized career migration data from publicly available LinkedIn profiles -- is this actually fine, or does aggregation create new privacy concerns?
- **Vercel Pro tier:** Free tier's 10-second timeout is likely insufficient. Budget $20/mo for Pro from the start, or architect around background jobs.
- **Cost modeling:** At what search volume do ScrapIn costs become prohibitive? Is there a breakeven where buying a dataset becomes cheaper than on-demand API calls?
