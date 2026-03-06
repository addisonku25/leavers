# Domain Pitfalls

**Domain:** Career migration / talent intelligence web app
**Researched:** 2026-03-06

## Critical Pitfalls

Mistakes that cause rewrites, legal exposure, or project failure.

### Pitfall 1: Building on LinkedIn Scraping Before Validating Data Access

**What goes wrong:** Teams spend weeks building scraping infrastructure, role matching, and UI -- only to discover LinkedIn's anti-bot detection kills the pipeline within days. LinkedIn employs behavioral analysis (mouse movements, scroll patterns, request timing), IP fingerprinting, and CAPTCHA escalation. Even with rotating residential proxies and random delays, accounts get banned and IP ranges get blacklisted. The scraping arms race is unwinnable for a side project.

**Why it happens:** The core product idea is exciting, so builders skip the hardest question ("can I actually get this data reliably?") and build the fun parts first. LinkedIn's public profiles look scrapable, but sustainable automated collection at scale is a fundamentally different problem.

**Consequences:**
- Weeks of wasted development on features that have no data to display
- Banned personal LinkedIn accounts (potentially your own professional network gone)
- Architecture built around a data source that doesn't work, requiring a rewrite

**Prevention:**
- Phase 0 must be a data access spike: manually test whether ScrapIn can reliably return career history data for a single company/role combo
- Use third-party API services (ScrapIn, Bright Data) instead of building scraping infrastructure
- Design the data layer as a pluggable adapter so the source can be swapped without rewriting the app
- Set a hard go/no-go decision point after the data spike before building any UI

**Detection:** You're in trouble if your first sprint includes both "build scraper" and "build dashboard." Those should be sequential with a decision gate between them.

**Phase mapping:** Must be addressed in Phase 1 (data access validation) before any other development.

---

### Pitfall 2: LinkedIn Terms of Service Violations and Legal Risk

**What goes wrong:** LinkedIn's User Agreement explicitly prohibits scraping, bots, and automated data collection. While the hiQ v. LinkedIn case established that scraping *public* data doesn't violate the CFAA (Computer Fraud and Abuse Act), that case ended with hiQ agreeing to a permanent injunction, deleting all scraped data, and paying $500,000 in damages -- on contract and unfair competition grounds, not CFAA. LinkedIn actively sues scrapers (e.g., the 2026 ProAPIs settlement).

**Why it happens:** Developers read "hiQ won at the Supreme Court" headlines without reading the final outcome. The CFAA defense doesn't protect against breach-of-contract or state unfair competition claims. If you agreed to LinkedIn's ToS (by having an account), you're bound by them.

**Consequences:**
- Cease-and-desist letters requiring data deletion
- Permanent LinkedIn account bans (your professional account, not just bot accounts)
- Lawsuits with real damages (LinkedIn has a legal team; you don't)
- If the product gains traction, LinkedIn's legal team notices

**Prevention:**
- Use API services (ScrapIn, Bright Data) that handle compliance and take on the legal risk themselves
- Never build your own scraper that logs into LinkedIn
- Consider a user-contributed model: users paste their own LinkedIn profile URL and voluntarily contribute their career history
- Never store raw scraped profiles -- aggregate and anonymize immediately
- If the product gains real traction, consult with a lawyer

**Detection:** If your architecture depends on logged-in LinkedIn sessions, you've crossed the line. If you're storing individual profile URLs or full names, you're accumulating liability.

**Phase mapping:** Must be resolved in Phase 1 alongside data access validation. The legal strategy constrains every technical decision.

---

### Pitfall 3: Displaying Identifiable Individuals Without Consent

**What goes wrong:** The product shows "Jane Smith left Company X for Company Y as a Senior PM." Jane didn't consent to being in your database, didn't know her career move would be displayed to strangers, and files a GDPR Right to Erasure request (or worse, a complaint). Under GDPR, fines reach 4% of annual revenue or EUR 20 million. Under CCPA, $2,500-$7,500 per violation. Even without regulatory action, individuals post angry tweets and you get reputation damage before launch.

**Why it happens:** The product's value proposition centers on showing where *real people* went, making it tempting to display names and specifics. "It's public data" feels like sufficient justification but isn't -- privacy laws treat scraped personal data as processing that requires a lawful basis, transparency, and respect for data subject rights regardless of whether the source was public.

**Consequences:**
- GDPR/CCPA enforcement actions with significant fines
- Mandatory data deletion requests that hollow out your dataset
- Negative press ("creepy career stalker app" headlines)
- App store / platform delistings

**Prevention:**
- Display only aggregated, anonymized patterns: "12 former Solution Engineers from Company X moved to Salesforce" -- never individual names
- The "aha moment" is the pattern, not the individual -- lean into this
- Build a deletion/opt-out mechanism from day one (not as an afterthought)
- Include a clear privacy policy explaining what data you collect and how
- Process raw API responses in memory and discard -- never persist individual details to Turso

**Detection:** If your database schema has a `person_name` column that's displayed in the UI, you have a privacy problem. If you can't answer "what happens when someone requests deletion?", you're not ready to launch.

**Phase mapping:** Privacy architecture must be designed in Phase 1, implemented by Phase 2 (MVP). Opt-out mechanism must exist at launch.

---

### Pitfall 4: Over-Engineering Role Matching Before Having Data

**What goes wrong:** Teams spend weeks building sophisticated NLP-powered job title normalization (BERT embeddings, custom taxonomies, hierarchical classification) before they have enough real data to know what variations actually exist. They build for "VP of Engineering" vs "Vice President, Engineering" when the real problem is "SE" could mean "Solution Engineer," "Software Engineer," "Sales Engineer," or "Systems Engineer" depending on the company.

**Why it happens:** Fuzzy matching is an intellectually interesting problem. It feels like core product logic. Developers gravitate toward it because it's a clean technical challenge compared to the messy data access problem.

**Consequences:**
- Weeks spent on matching logic that produces false positives at scale (matching "Sales Engineer" with "Software Engineer" destroys user trust)
- Architecture locked into an approach before understanding the actual data distribution
- False confidence in match quality without real-world validation data

**Prevention:**
- Start with Fuse.js + a hand-curated synonym dictionary. This handles 80% of cases.
- Collect real query data and real mismatches before investing in ML-based matching
- Build matching as a separate module (`lib/matching/`) so it can be upgraded independently
- Accept that company-specific context matters: "SE at Salesforce" means something different than "SE at Google" -- no generic normalizer handles this well
- Add a "Did you mean...?" disambiguation step when ambiguous acronyms are detected

**Detection:** If you're training models before you have 1,000 real career histories in your database, you're over-engineering. If you can't manually verify match quality for your first 100 queries, your matching is too opaque.

**Phase mapping:** Phase 1-2 should use Fuse.js + synonym lists. ML-based matching is Phase 3+ only after real usage data exists.

---

## Moderate Pitfalls

### Pitfall 5: Third-Party LinkedIn Data APIs Are Unstable and Expensive

**What goes wrong:** Teams adopt services like ScrapIn or Bright Data as the "legitimate" alternative to scraping, then discover these services are themselves scrapers with licensing gray areas. Proxycurl has already shut down entirely. Others change pricing, reduce data freshness, or get shut down by LinkedIn legal action.

**Prevention:**
- Budget for data costs realistically: ScrapIn at $1/1,000 records means 10,000 career histories = $10 for records, but you may need multiple API calls per search
- Have a fallback strategy -- never depend on a single third-party provider (provider adapter pattern)
- Cache aggressively in Upstash Redis (30-day TTL): career history data doesn't change daily
- Validate data freshness guarantees in practice, not just marketing
- Monitor provider health: if their LinkedIn access gets cut, yours does too

**Detection:** If your entire product depends on one API provider, you're one business decision away from zero data.

**Phase mapping:** Evaluate in Phase 1 data spike. Build provider abstraction layer in Phase 1-2.

---

### Pitfall 6: On-Demand Fetching Creates Terrible First-Search UX

**What goes wrong:** The "on-demand + cache" strategy means the first user to search for "Solution Engineers at Palantir" triggers a live data fetch that takes 10-30 seconds. Users see a spinner and leave. Vercel's free tier has a 10-second function timeout, which may kill the request.

**Prevention:**
- Use Vercel Pro tier ($20/mo) for 60-second function timeout from the start
- Set user expectations: "Building your career map... this takes ~15-30 seconds for new searches"
- Show progressive loading states (skeleton UI + status updates)
- Implement background enrichment with polling: return a search ID immediately, client polls for completion
- Pre-seed the cache for a handful of high-value company/role combinations before launch
- Track cache hit rates -- if they're below 50%, the on-demand model may need rethinking

**Detection:** If your demo requires waiting more than 10 seconds for results, users will bounce. Test with roles/companies you haven't pre-cached.

**Phase mapping:** UX mitigation in Phase 2 (MVP). Pre-seeding strategy in Phase 3.

---

### Pitfall 7: Conflating "People Who Left" with "Career Migration Patterns"

**What goes wrong:** Raw data shows individuals who changed jobs, but users want patterns and insights. Showing "3 people went to Google" without context (out of how many? over what time period? from what level?) creates misleading conclusions. A company with 50,000 employees losing 3 SEs to Google is noise; a company with 50 employees losing 3 is a signal.

**Prevention:**
- Always show context: counts relative to total sample size
- Include time ranges on all data ("in the last 2 years")
- Surface confidence indicators: "Based on 47 career moves" vs "Based on 3 career moves"
- Start with simple aggregation and explicit caveats rather than complex statistical normalization

**Detection:** If your insights page would show Google and Amazon as top destinations for every single role at every company (because they hire at massive scale), your analysis isn't useful.

**Phase mapping:** Basic context (counts, time ranges) in Phase 2. Statistical normalization in Phase 3 (insights layer).

---

## Minor Pitfalls

### Pitfall 8: Auth Complexity Before Product Validation

**What goes wrong:** Building OAuth flows, account management, saved searches, and premium feature gates before knowing if anyone wants the core product.

**Prevention:**
- Launch with zero auth. Just a search box and results.
- Add accounts only when you have a proven feature that requires them (saved searches need users who come back)
- Use Better Auth when you do add it -- first-class Turso support, plugin architecture for future needs
- Gate auth behind retention data, not technical readiness

**Detection:** If you're building auth before you've had 100 organic searches, you're sequencing wrong.

**Phase mapping:** Phase 1-2 should be auth-free. Phase 3+ adds accounts if retention data justifies it.

---

### Pitfall 9: Building for Scale Before Validating Demand

**What goes wrong:** Setting up complex infrastructure for a product that might get 10 users per day.

**Prevention:**
- Next.js + Vercel + Turso + Upstash Redis is plenty for the first 10,000 users
- Don't add additional caching layers, job queues, or CDN complexity until you have measurable performance problems
- The stack recommendation already handles scaling gracefully (serverless compute, edge DB, serverless Redis)

**Detection:** If your architecture diagram has more than 5 services before you have 100 users, simplify.

**Phase mapping:** Simple stack through Phase 3. Scale infrastructure only in Phase 4+ based on real traffic data.

---

### Pitfall 10: Ignoring Indeed and Other Data Sources

**What goes wrong:** Teams fixate on LinkedIn as the only data source because it has the most comprehensive professional profiles. Meanwhile, Indeed has 35+ million anonymized jobseeker profiles, and user-contributed data could be the most legally clean source.

**Prevention:**
- Research Indeed's data access options alongside LinkedIn
- Build the data model to accommodate multiple sources from day one (provider adapter pattern)
- User-contributed data (people voluntarily sharing their career path) could be a future differentiator
- The provider adapter pattern in ARCHITECTURE.md handles this naturally

**Detection:** If every conversation about data starts and ends with "LinkedIn," you have a single point of failure.

**Phase mapping:** Multi-source strategy should be designed in Phase 1, even if ScrapIn (LinkedIn-focused) is the first provider.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Data Access Validation | Skipping the spike and jumping to building infrastructure | Timebox to 1 week. Test ScrapIn API with real queries. Go/no-go gate before Phase 2 |
| Phase 1: Data Access Validation | Assuming ScrapIn can answer "where did people go" directly | ScrapIn may only do profile enrichment. You may need to aggregate career histories yourself. Test this. |
| Phase 2: MVP | Over-engineering role matching with ML before having real data | Start with Fuse.js + synonym lists. Upgrade matching only after collecting real query/mismatch data |
| Phase 2: MVP | Displaying individual names/profiles | Aggregate only. "12 people moved to X" not "John Smith moved to X" |
| Phase 2: MVP | Adding auth before validating core search value | Ship without accounts. Measure if people return before building accounts |
| Phase 3: Insights Layer | Showing raw counts without normalization | Always show relative context: time period, sample size |
| Phase 3: Insights Layer | False positives in fuzzy matching eroding trust | Confidence scores on matches. Let users correct/report bad matches |
| Phase 4+: Growth | Scaling infrastructure before scaling users | Don't add complexity until real bottlenecks appear in monitoring |
| Any Phase | Single data provider dependency | Always have a fallback. Providers get acquired, shut down, or lose access |

## Sources

- [LinkedIn User Agreement](https://www.linkedin.com/legal/user-agreement)
- [LinkedIn ToS Breaches - Risks, Enforcement, and Limits](https://pettauer.net/en/linkedin-tos-breaches-risk-enforcement-comparison/)
- [hiQ Labs v. LinkedIn - Wikipedia](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn)
- [LinkedIn Reaches Deal in Data-Scraping Lawsuit Against ProAPIs](https://thelinkedblog.com/2026/linkedin-reaches-deal-in-data-scraping-lawsuit-against-proapis-3857/)
- [Web Scraping Under GDPR and CCPA](https://iswebscrapinglegal.com/blog/gdpr-ccpa-web-scraping/)
- [Best LinkedIn Data API Providers Compared (2026)](https://www.netrows.com/blog/best-linkedin-data-api-providers-2026)
- [Vercel Function Limits](https://vercel.com/docs/functions/limitations)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)
