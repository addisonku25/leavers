# Feature Landscape

**Domain:** Career migration / talent intelligence (consumer-facing)
**Researched:** 2026-03-06

## Market Context

The talent intelligence space is dominated by enterprise products (Revelio Labs, Lightcast, Aura, LinkedIn Talent Insights) that sell to HR teams, recruiters, and investors at enterprise pricing. These platforms track workforce flows across millions of profiles with deep segmentation. LinkedIn's own Career Explorer tool is the closest consumer-facing analog, but it focuses on skill-to-role matching rather than "where did people from your exact seat go next."

**Leavers' positioning gap:** No consumer product currently answers the specific question "I'm a Solution Engineer at Company X -- where did the last 20 people in my role go?" The enterprise tools have this data but gate it behind $10K+ contracts. LinkedIn's Alumni Tool shows school-based connections, not role-based departures. This is a genuine whitespace.

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Company + role search | The literal core query. Without it, there is no product. | Low | Simple input form. The hard part is what happens after. |
| Destination company list with counts | Users need to see "12 people went to Salesforce, 8 to Google" -- this is the minimum useful output. | Medium | Requires data aggregation and deduplication of company names. |
| Destination role breakdown | Knowing the company isn't enough -- users need to see what roles people landed in. | Medium | Depends on role normalization working well. |
| Fuzzy role matching | Job titles are wildly inconsistent. "Sr. Solution Engineer" must match "Solutions Engineer" and "SE." Without this, results are uselessly narrow. | High | This is the hardest table-stakes feature. Start with Fuse.js + manual synonym lists and upgrade later if needed. |
| Reasonable response time | Users will tolerate a loading state for first search (novel query), but cached results must feel instant (<2s). | Medium | On-demand fetch + Upstash Redis caching handles this. |
| Mobile-responsive web UI | Users will research careers on their phones during commutes. | Low | Standard responsive design with Tailwind + shadcn/ui. |
| Basic data freshness indicators | Users need to know if they're seeing data from 2024 or 2019. "Based on N transitions in the last 3 years" type context. | Low | Metadata from data collection timestamps stored in Turso. |

## Differentiators

Features that set Leavers apart from both enterprise tools (by being free/consumer) and LinkedIn (by being specific to departure patterns).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Pattern insights layer | Go beyond raw lists: "People from your role tend to move to Series B-D startups in adjacent industries" or "65% stayed in customer-facing roles." This is the "aha moment" described in PROJECT.md. | High | Requires enough data volume per query to surface statistically meaningful patterns. Start with simple aggregations (top 3 destinations, role category distribution). Graduate to richer insights as data grows. |
| Sankey/flow visualization | Visual representation of talent flow from source company/role to destinations. Enterprise tools (Aura, OneModel) use Sankey diagrams -- bringing this to consumers is compelling and shareable. | Medium | Recharts handles Sankey rendering. The data shape (source -> destination with weight) maps naturally. |
| Role transition categories | Show not just individual destinations but categorized transitions: "lateral move," "promotion," "industry switch," "function change." Helps users understand the type of move, not just the destination. | Medium | Requires classifying role pairs. Can start with seniority-level detection (IC to Manager, Senior to Lead) and industry tagging. |
| Saved searches + alerts | Let authenticated users save a search and get notified when new data appears for their query. Creates retention and recurring engagement. | Medium | Requires Better Auth + background job to check for new data. The notification itself is simple (email). |
| Comparison view | "Where do Solution Engineers from Datadog go vs. Solution Engineers from MongoDB?" Side-by-side comparison reveals company-specific patterns. | Medium | UI challenge more than data challenge. Same underlying query, different presentation. |
| Time-based trends | Show how destination patterns have changed over time. "In 2022, most SEs went to other SaaS companies. By 2025, 30% were going to AI startups." | High | Requires longitudinal data with timestamps. Won't be available at launch but becomes powerful as the cache grows. |
| Shareable results cards | Generate a shareable image/link: "Here's where Solution Engineers from Acme Corp end up." Viral distribution mechanism. | Low | OG image generation (Vercel OG) + shareable URL with query params. |

## Anti-Features

Features to explicitly NOT build. Each represents a trap that would dilute focus or create unsolvable problems.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Individual person profiles/names | Displaying "John Smith left Acme for Google" creates massive privacy concerns, potential legal issues, and LinkedIn ToS violations. Enterprise tools can do this because they have data agreements. Leavers cannot. | Show only aggregated, anonymized data: "12 people with your role went to Google." Never display individual identities. |
| Job application tracking | PROJECT.md explicitly scopes this out. It's a totally different product (Huntr, Teal, etc.) and would fragment the core value. | Stay focused on discovery and insight. Link out to job boards for the "now go apply" step. |
| Resume upload/comparison | Scoped to v2 in PROJECT.md. Adding AI resume analysis before validating that anyone cares about the migration data would be premature optimization. | Validate the core search/insight loop first. If users love the data, resume comparison becomes a natural upsell. |
| Real-time social/networking features | Chat, messaging, "connect with people who made this transition" -- this is LinkedIn's moat and fighting it is suicidal. | Surface the insight. Let users take that insight back to LinkedIn/email to make connections. |
| Salary data | Extremely hard to source accurately, legally fraught, and already done well by Levels.fyi, Glassdoor, and Payscale. Adding unreliable salary data would undermine trust in the migration data. | Potentially link to Levels.fyi or Glassdoor for salary context, but don't own this data. |
| Predictive "you should go to X" recommendations | Algorithmic career advice is a liability minefield. If the product says "you should go to Google" and someone quits their job, that's a bad look. | Show evidence ("here's where people went") and let users draw their own conclusions. Descriptive, not prescriptive. |
| Company reviews/ratings | Glassdoor and Blind own this. Duplicating it dilutes focus and requires massive content moderation. | Link out to Glassdoor/Blind for the "what's it like there" question. |
| Recruiter/employer-facing features | Tempting revenue path, but serving two masters (job seekers AND employers) creates conflicting incentives. Enterprise talent intelligence is a different business. | Stay consumer-focused. If enterprise interest materializes, that's a separate product/company. |

## Feature Dependencies

```
Fuzzy Role Matching ──┬──> Destination Company List
                      └──> Destination Role Breakdown
                                    │
                                    v
                            Pattern Insights Layer
                                    │
                      ┌─────────────┼──────────────┐
                      v             v              v
              Role Transition   Time-based     Comparison
              Categories        Trends         View

Company + Role Search ──> Data Fetching Pipeline ──> Caching Layer
                                                        │
                                                        v
                                                  Saved Searches + Alerts

Destination Company List ──> Sankey Visualization

Destination Company List ──> Shareable Results Cards

Authentication ──> Saved Searches + Alerts
```

Key dependency insight: **Fuzzy role matching is the critical path.** Almost every valuable feature downstream depends on the quality of role normalization. If "Solution Engineer" only matches exact strings, the destination lists will be too thin to generate meaningful patterns. Invest here first.

## MVP Recommendation

**Phase 1 -- Prove the data works (table stakes only):**
1. Company + role search input
2. Fuzzy role matching (Fuse.js + synonym lists)
3. Destination company list with counts
4. Destination role breakdown
5. Basic data freshness indicators
6. Mobile-responsive UI

**Phase 2 -- Make it sticky (first differentiators):**
1. Pattern insights layer (simple aggregations)
2. Sankey/flow visualization (Recharts)
3. Shareable results cards (Vercel OG)
4. Authentication system (Better Auth)

**Phase 3 -- Retention and depth:**
1. Saved searches + alerts
2. Comparison view
3. Role transition categories

**Defer indefinitely:**
- Time-based trends: Requires months of accumulated data before it's meaningful
- Resume comparison: v2 per PROJECT.md, only after core validation
- Any employer-facing features

## Competitive Reference

| Feature | LinkedIn Talent Insights | Revelio Labs | Lightcast | Aura | LinkedIn Career Explorer | **Leavers** |
|---------|------------------------|-------------|-----------|------|------------------------|-------------|
| Target user | Enterprise HR/recruiting | Enterprise/investors | Enterprise workforce planning | Enterprise strategy | Individual job seekers | Individual job seekers |
| Talent migration data | Yes | Yes | Yes | Yes | No (skill-based) | Yes |
| Role-specific departures | Yes | Yes | Limited | Yes | No | Yes (core feature) |
| Individual access | No ($$$) | No ($$$) | No ($$$) | No ($$$) | Yes (free) | Yes (free/freemium) |
| Aggregated patterns | Yes | Yes | Yes | Yes | No | Yes |
| Data scale | 850M+ profiles | 19M+ companies | 2.5B job postings | 2B+ data points | LinkedIn members | Starts small, grows |
| Pricing | Enterprise only | Enterprise only | Enterprise only | Enterprise only | Free | Free / freemium |

**Leavers' unique position:** Consumer-accessible talent migration data. The enterprise tools have the data but not the audience. LinkedIn Career Explorer has the audience but answers a different question (skills-to-roles, not departures-to-destinations).

## Sources

- [LinkedIn Talent Insights Features](https://www.g2.com/products/linkedin-talent-insights/features)
- [Revelio Labs Product](https://www.reveliolabs.com/data/)
- [Lightcast Data Overview](https://lightcast.io/products/data/overview)
- [Aura Talent Outflows](https://blog.getaura.ai/talent-outflows-and-workforce-movement)
- [OneModel Sankey Diagrams](https://www.onemodel.co/product-innovation-blog/sankey-diagram)
- [LinkedIn Career Explorer](https://linkedin.github.io/career-explorer/)
