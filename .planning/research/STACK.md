# Technology Stack

**Project:** Leavers - Career Migration Intelligence
**Researched:** 2026-03-06

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 15.x (stable) | Full-stack React framework | First-class Vercel deployment, App Router + Server Actions eliminate need for separate API layer. v15 is the safe production choice; v16 is too fresh for a greenfield project where stability matters. | HIGH |
| React | 19.x | UI library | Ships with Next.js 15, concurrent features and Server Components are mature | HIGH |
| TypeScript | 5.5+ | Type safety | Non-negotiable for any serious project in 2026; catches data shape issues early, which matters when dealing with scraped data of unpredictable structure | HIGH |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Turso | Latest | Primary database (libSQL/SQLite) | Already in Addison's account, edge-ready, generous free tier, native Vercel marketplace integration. SQLite semantics are simple for a solo dev. Career migration data is relational (people, companies, roles, transitions) and fits SQL perfectly. | HIGH |
| Drizzle ORM | 1.0.0-beta.2+ | Database ORM | Type-safe SQL, native Turso/libSQL driver, schema-as-code with migration tooling, validator packages now built-in (drizzle-zod). Lighter than Prisma, better DX for SQLite. | HIGH |
| Upstash Redis | Latest | Caching layer | Serverless Redis with HTTP API -- no connection pooling issues on Vercel. Pay-per-request pricing ($0.20/100K commands, 500K/month free). Perfect for caching scraped results with TTL. | HIGH |

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Better Auth | Latest | Authentication | Auth.js (NextAuth) team now recommends Better Auth for new projects. First-class SQLite/Turso support (not just community adapters). Built-in rate limiting, MFA, magic links. Plugin architecture for future premium features. Same DB as app data = simpler infra. | MEDIUM |

### Data Sourcing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ScrapIn API | Latest | LinkedIn career data extraction | Pay-as-you-go ($1/1,000 records), real-time data (not stale database), GDPR/CCPA compliant, developer-focused API. Much cheaper than Bright Data ($0.05/profile). Best fit for on-demand scraping model. | MEDIUM |
| Bright Data | Latest | Fallback LinkedIn data source | More mature platform, $0.05/profile, handles proxies/CAPTCHAs automatically. Use as fallback if ScrapIn quality or uptime is insufficient. | LOW |

### UI & Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | Industry standard for Next.js apps, zero runtime cost, v4 stable with @theme directive | HIGH |
| shadcn/ui | Latest | Component library | Not a dependency -- components copied into project and owned. Built on Radix UI (accessible). 65K+ GitHub stars, used by Vercel itself. Tailwind v4 + React 19 support. | HIGH |
| Recharts | 2.x | Data visualization | Simple API for bar/pie/sankey charts showing migration patterns. Better docs than Nivo, intuitive composable API. Dataset sizes for this app are small (dozens of companies, not thousands) so SVG rendering is fine. | MEDIUM |

### Fuzzy Matching

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Fuse.js | 7.x | Client-side fuzzy search for role titles | Zero dependencies, configurable thresholds and field weights. Job title matching needs typo tolerance + synonym-like matching ("Sr. SE" ~ "Senior Solution Engineer"). Set `ignoreFieldNorm: true` for better results. | HIGH |

### Validation & Forms

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | 4.x | Schema validation | 14x faster string parsing vs v3, 57% smaller core. Drizzle ORM has built-in Zod integration for schema-to-validator generation. Use @zod/mini (1.9KB) for client-side forms. | HIGH |
| React Hook Form | Latest | Form management | Pairs with Zod resolver, minimal re-renders, standard for Next.js apps | HIGH |

### Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Hosting & deployment | Already has account, zero-config Next.js deployment, preview deployments, generous free tier (100GB bandwidth, 6K build minutes). Owns the Next.js runtime. | HIGH |
| Cloudflare | N/A | DNS + CDN layer | Already has account. Use as DNS provider with proxy for DDoS protection and edge caching of static assets. Do NOT use Cloudflare Workers/Pages -- keep compute on Vercel. | HIGH |
| GitHub | N/A | Source control + CI/CD | Already has account, Vercel auto-deploys from GitHub pushes | HIGH |

### Developer Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Biome | Latest | Linting + formatting | Replaces ESLint + Prettier with single tool, 100x faster, zero config. Next.js is deprecating `next lint` in favor of community tools. | MEDIUM |
| Turbopack | Bundled with Next.js | Dev server bundler | Ships with Next.js 15, dramatically faster HMR than webpack. No separate install needed. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 15 | Next.js 16 | Too new (Dec 2025), fewer community examples for troubleshooting |
| Framework | Next.js 15 | Remix/Astro | Vercel is already in the stack; Next.js has first-class Vercel support |
| ORM | Drizzle | Prisma | Prisma's SQLite support is weaker, heavier bundle, slower cold starts on serverless |
| Auth | Better Auth | Auth.js v5 | Auth.js team themselves recommends Better Auth for new projects |
| Auth | Better Auth | Clerk | External dependency, paid service, overkill for MVP |
| Cache | Upstash Redis | Vercel KV | Vercel KV is actually Upstash Redis underneath, but direct Upstash is cheaper and more flexible |
| UI | shadcn/ui | Material UI (MUI) | MUI is heavy, opinionated styling, harder to customize |
| Charts | Recharts | Nivo | Nivo has poor documentation; Recharts is simpler for the chart types needed here |
| Fuzzy Search | Fuse.js | Typesense/Algolia | Server-side search services are overkill; role title matching is a small dataset problem |
| Data Source | ScrapIn | Proxycurl | Proxycurl is defunct (founder moved to NinjaPear) |
| Linting | Biome | ESLint + Prettier | Two tools where one suffices; ESLint configs are notoriously fiddly |

## Do NOT Use

| Technology | Why Not |
|------------|---------|
| Prisma | Heavier, slower cold starts, weaker SQLite story vs Drizzle |
| Proxycurl | Service is discontinued |
| MongoDB/Supabase | Career migration data is inherently relational; Turso is already in the stack |
| Puppeteer/Playwright for scraping | Headless browser scraping of LinkedIn will get blocked immediately; use API services instead |
| NextAuth/Auth.js | Even its own maintainers recommend Better Auth for new projects |
| Vercel Postgres | You already have Turso; adding a second DB creates unnecessary complexity |

## Installation

```bash
# Create Next.js project
npx create-next-app@latest leavers --typescript --tailwind --eslint --app --src-dir

# Core dependencies
npm install @libsql/client drizzle-orm better-auth @upstash/redis zod react-hook-form @hookform/resolvers fuse.js recharts

# Dev dependencies
npm install -D drizzle-kit @biomejs/biome

# shadcn/ui (initialize, then add components as needed)
npx shadcn@latest init
npx shadcn@latest add button input card table dialog
```

## Key Configuration Notes

- **Turso**: Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` env vars. Use local SQLite file for dev (`file:local.db`), Turso remote for production.
- **Upstash Redis**: Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Use `@upstash/redis` HTTP client (not `ioredis`).
- **Fuse.js**: Configure with `ignoreFieldNorm: true`, threshold ~0.4, and weighted keys for role title fields.
- **Better Auth**: Configure with Turso adapter, same DB as application data.
- **Cloudflare**: DNS proxy mode only. Do not enable Workers or try to run Next.js on Cloudflare.

## Sources

- [Next.js Blog](https://nextjs.org/blog) - v15/v16 release info
- [Turso Documentation](https://docs.turso.tech/) - libSQL and edge features
- [Drizzle ORM Turso Integration](https://orm.drizzle.team/docs/connect-turso)
- [Better Auth Next.js Integration](https://better-auth.com/docs/integrations/next)
- [ScrapIn API](https://www.scrapin.io/) - LinkedIn data API
- [Upstash Redis Pricing](https://upstash.com/pricing/redis)
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Fuse.js](https://www.fusejs.io/) - Fuzzy search
- [Zod v4](https://zod.dev/) - Schema validation
- [Recharts](https://recharts.org/) - Charting library
