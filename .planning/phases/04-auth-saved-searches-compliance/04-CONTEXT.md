# Phase 4: Auth, Saved Searches & Compliance - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

User accounts with email/password authentication, persistent saved searches for authenticated users, rate limiting for both search and auth endpoints, and legal compliance pages (ToS, privacy policy). Introduces a persistent nav bar with auth controls and a site-wide footer. No OAuth, no email verification, no premium/paid features.

</domain>

<decisions>
## Implementation Decisions

### Authentication Flow
- Email + password only -- no OAuth providers, no magic links
- No email verification for v1 -- users can save searches immediately after sign-up
- Dedicated /login and /signup pages (separate routes, not modals)
- Top-right nav bar buttons: "Sign In" / "Sign Up" for guests; user email or avatar with dropdown (logout) for authenticated users
- Persistent nav bar across all pages (new component -- doesn't exist yet)
- Session persists across browser sessions (AUTH-02)

### Saved Searches UX
- Explicit "Save Search" button in the results header (labeled, not just an icon)
- Button shows saved state after saving (e.g., "Saved" with checkmark)
- Dedicated /saved page linked from nav bar (visible only when logged in)
- Each saved search card shows: company name, role title, date saved, "View Results" link, delete button
- No result summary on saved search cards -- keep it clean
- Unauthenticated user clicking "Save Search" redirects to /signup with return URL; after sign-up, the search auto-saves

### Rate Limiting
- Unauthenticated: 3 searches per day per IP address
- Authenticated: 50 searches per hour per user
- Auth endpoints: 5 login/signup attempts per 15 minutes per IP (brute-force protection)
- Implementation via Upstash Redis sliding window (already in stack)
- When guest hits limit: friendly message + sign-up CTA ("You've used your 3 daily searches. Sign up for more.")
- When auth user hits limit: "Slow down -- try again in X minutes."

### Legal Pages
- Template-based minimal content -- not lawyer-reviewed, covers basics
- Routes: /terms and /privacy
- Same app layout (nav bar + footer) as rest of app
- Persistent footer on all pages with ToS and Privacy Policy links (new component)
- Privacy policy references "publicly available professional data" -- does NOT name LinkedIn specifically
- Content covers: data collection, usage, aggregated data disclaimer, no warranties, account terms

### Claude's Discretion
- Auth library choice (NextAuth v5, Better Auth, Lucia, or custom JWT -- pick what fits Next.js 16 + Turso best)
- Password hashing approach (bcrypt, argon2, etc.)
- Session strategy (JWT vs database sessions)
- Nav bar and footer visual design, spacing, responsive behavior
- Saved search card layout and delete confirmation UX
- Rate limit error page/component design
- Legal page template selection and exact content
- Database schema for users and saved_searches tables

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- shadcn Card, Button, Input, Skeleton components -- reusable for auth forms and saved search cards
- Search form pattern (react-hook-form + zod validation) in `src/components/search-form.tsx` -- same pattern for auth forms
- Results page at `src/app/results/[id]/page.tsx` -- "Save Search" button integrates into ResultsDashboard header
- Upstash Redis client already configured in `src/lib/cache/` -- reuse for rate limiting counters
- Lucide icons available for nav bar, save button states, footer links

### Established Patterns
- Drizzle ORM + Turso (libsql) for database -- new users/saved_searches tables follow same pattern as searches/migrations
- React Server Components for data fetching, client components for interactive elements
- Server actions for mutations (used in search flow) -- same pattern for save/delete/auth actions
- Tailwind v4 with CSS custom properties for theming
- Biome for linting/formatting

### Integration Points
- `src/app/layout.tsx` -- needs session provider wrapper and nav bar component
- `src/lib/db/schema.ts` -- add users and saved_searches tables
- `src/lib/db/index.ts` -- no changes needed (shared db client)
- New middleware needed for: auth session validation, rate limiting
- Results page header -- add "Save Search" button (needs auth state check)
- Nav bar links to /saved (conditional on auth state)

</code_context>

<specifics>
## Specific Ideas

- The "Save Search" -> sign-up -> auto-save flow should feel seamless -- the user shouldn't have to re-find their search after signing up
- Rate limiting for guests (3/day) is intentionally aggressive to drive sign-ups -- this is a conversion lever
- Nav bar should be minimal and not compete with the search-focused hero on the landing page
- Legal pages are checkbox compliance for v1, not a selling point -- keep them simple and honest

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 04-auth-saved-searches-compliance*
*Context gathered: 2026-03-06*
