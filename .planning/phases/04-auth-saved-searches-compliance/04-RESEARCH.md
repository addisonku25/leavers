# Phase 4: Auth, Saved Searches & Compliance - Research

**Researched:** 2026-03-06
**Domain:** Authentication, rate limiting, legal compliance (Next.js 16 + Turso + Upstash)
**Confidence:** HIGH

## Summary

This phase adds user accounts (email/password), saved searches for authenticated users, rate limiting for abuse prevention, and legal compliance pages. The stack decision with the most impact is the auth library choice -- Better Auth is the clear winner for this project because (a) Lucia is deprecated as of March 2025, (b) Auth.js/NextAuth v5 has known issues with async SQLite clients like Turso's libsql, and (c) Better Auth has native Drizzle adapter support with SQLite provider and works cleanly with Next.js 16's new proxy model.

Rate limiting uses the existing Upstash Redis infrastructure with `@upstash/ratelimit` -- a purpose-built library for serverless rate limiting that supports sliding windows out of the box. The legal pages are static content with no special technical requirements.

**Primary recommendation:** Use Better Auth with Drizzle adapter (SQLite provider) for authentication, `@upstash/ratelimit` sliding window for rate limiting, and static Next.js pages for legal content.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Email + password only -- no OAuth providers, no magic links
- No email verification for v1 -- users can save searches immediately after sign-up
- Dedicated /login and /signup pages (separate routes, not modals)
- Top-right nav bar buttons: "Sign In" / "Sign Up" for guests; user email or avatar with dropdown (logout) for authenticated users
- Persistent nav bar across all pages (new component -- doesn't exist yet)
- Session persists across browser sessions (AUTH-02)
- Explicit "Save Search" button in the results header (labeled, not just an icon)
- Button shows saved state after saving (e.g., "Saved" with checkmark)
- Dedicated /saved page linked from nav bar (visible only when logged in)
- Each saved search card shows: company name, role title, date saved, "View Results" link, delete button
- No result summary on saved search cards -- keep it clean
- Unauthenticated user clicking "Save Search" redirects to /signup with return URL; after sign-up, the search auto-saves
- Unauthenticated: 3 searches per day per IP address
- Authenticated: 50 searches per hour per user
- Auth endpoints: 5 login/signup attempts per 15 minutes per IP (brute-force protection)
- Implementation via Upstash Redis sliding window (already in stack)
- When guest hits limit: friendly message + sign-up CTA
- When auth user hits limit: "Slow down -- try again in X minutes."
- Template-based minimal content for legal pages -- not lawyer-reviewed
- Routes: /terms and /privacy
- Persistent footer on all pages with ToS and Privacy Policy links (new component)
- Privacy policy references "publicly available professional data" -- does NOT name LinkedIn specifically

### Claude's Discretion
- Auth library choice (NextAuth v5, Better Auth, Lucia, or custom JWT)
- Password hashing approach (bcrypt, argon2, etc.)
- Session strategy (JWT vs database sessions)
- Nav bar and footer visual design, spacing, responsive behavior
- Saved search card layout and delete confirmation UX
- Rate limit error page/component design
- Legal page template selection and exact content
- Database schema for users and saved_searches tables

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | Better Auth `emailAndPassword: { enabled: true }` with auto sign-in after signup |
| AUTH-02 | User can log in and stay logged in across sessions | Better Auth database sessions with `nextCookies` plugin for persistent cookies |
| AUTH-03 | User can log out | Better Auth `authClient.signOut()` with redirect |
| SAVE-01 | Authenticated user can save a search for later | New `saved_searches` table in Drizzle schema + server action |
| SAVE-02 | Authenticated user can view their saved searches | /saved page with server component querying saved_searches joined to searches |
| SAVE-03 | Authenticated user can delete a saved search | Server action with auth check + delete from saved_searches |
| PRIV-02 | App rate-limits searches to prevent abuse | `@upstash/ratelimit` sliding window in proxy.ts + search action |
| PRIV-03 | App includes terms of service and privacy policy pages | Static /terms and /privacy routes with legal content |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | latest | Authentication framework | Native Drizzle + SQLite support, active development (Lucia deprecated), no async client issues like Auth.js |
| @upstash/ratelimit | latest | Rate limiting | Purpose-built for serverless/edge, works with existing Upstash Redis, sliding window algorithm included |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-auth/react | (bundled) | Client-side auth hooks | `useSession()` hook for reactive auth state in client components |
| better-auth/next-js | (bundled) | Next.js integration | `toNextJsHandler` for route handler, `nextCookies` plugin for server actions |
| better-auth/adapters/drizzle | (bundled) | Database adapter | Connects Better Auth to existing Drizzle + Turso setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | Auth.js v5 (NextAuth) | Auth.js Drizzle adapter has known issues with async SQLite clients (Turso libsql). GitHub issues #8335 and #9276 document this. Would require workarounds. |
| Better Auth | Lucia | Deprecated as of March 2025. Now only a learning resource. |
| Better Auth | Custom JWT | Would work but requires hand-rolling session management, CSRF protection, token rotation -- all solved problems. |
| Database sessions | JWT sessions | Better Auth defaults to database sessions which are more secure (revocable, no token size limits). JWT adds complexity for no benefit in this app. |

**Installation:**
```bash
npm install better-auth @upstash/ratelimit
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── auth.ts              # Better Auth server instance configuration
│   ├── auth-client.ts        # Better Auth client instance (React hooks)
│   ├── db/
│   │   └── schema.ts         # Add user, session, account, verification + saved_searches tables
│   └── cache/
│       └── redis.ts           # Existing -- reused by rate limiter
├── app/
│   ├── api/auth/[...all]/
│   │   └── route.ts          # Better Auth route handler
│   ├── login/page.tsx         # Login form page
│   ├── signup/page.tsx        # Signup form page
│   ├── saved/page.tsx         # Saved searches page (auth-gated)
│   ├── terms/page.tsx         # Terms of service (static)
│   ├── privacy/page.tsx       # Privacy policy (static)
│   └── layout.tsx             # Wraps children with NavBar + Footer
├── components/
│   ├── nav-bar.tsx            # Persistent nav with auth state
│   ├── footer.tsx             # Persistent footer with legal links
│   ├── save-search-button.tsx # Save/unsave toggle on results page
│   ├── saved-search-card.tsx  # Card for /saved page
│   └── auth/
│       ├── login-form.tsx     # Email + password login form
│       └── signup-form.tsx    # Email + password signup form
├── actions/
│   ├── search.ts              # Existing -- add rate limit check
│   └── saved-searches.ts     # Save, list, delete server actions
└── proxy.ts                   # Rate limiting + auth cookie check
```

### Pattern 1: Better Auth Server Configuration
**What:** Central auth instance that all server-side code imports
**When to use:** Every file that needs auth (route handler, server components, server actions, proxy)
**Example:**
```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Sign in immediately after signup
  },
  plugins: [nextCookies()], // Required for server action cookie handling
});
```
Source: https://better-auth.com/docs/integrations/next

### Pattern 2: Better Auth Client
**What:** Client-side auth hooks and methods
**When to use:** Client components that need auth state or auth actions
**Example:**
```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

// Usage in components:
// const { data: session, isPending } = authClient.useSession();
// await authClient.signUp.email({ email, password, name });
// await authClient.signIn.email({ email, password });
// await authClient.signOut();
```
Source: https://better-auth.com/docs/basic-usage

### Pattern 3: Next.js 16 Proxy for Rate Limiting
**What:** proxy.ts replaces middleware.ts in Next.js 16 -- runs on Node.js runtime (not Edge)
**When to use:** Request-level concerns like rate limiting and auth redirects
**Example:**
```typescript
// src/proxy.ts (root of src/ or project root -- same location as old middleware.ts)
import { type NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 d"), // 3 per day for guests
  prefix: "ratelimit:search:guest",
});

export async function proxy(request: NextRequest) {
  // Rate limiting logic here
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, remaining, reset } = await ratelimit.limit(ip);
  // ...
}

export const config = {
  matcher: ["/api/auth/:path*", /* other paths */],
};
```
Source: https://nextjs.org/docs/app/getting-started/proxy, https://github.com/upstash/ratelimit-js

### Pattern 4: Server-Side Session Check in RSC
**What:** Get session in React Server Components for conditional rendering
**When to use:** Pages that show different content for auth/unauth users (nav bar, results page, saved page)
**Example:**
```typescript
// In any server component
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  // session.user.email, session.user.name, session.user.id available
}
```
Source: https://better-auth.com/docs/integrations/next

### Pattern 5: Save-then-Redirect Flow for Unauthenticated Users
**What:** When unauth user clicks "Save Search", redirect to signup with return URL; auto-save after signup
**When to use:** The save search button on results page
**Design:**
1. "Save Search" button checks auth state client-side via `useSession()`
2. If not authenticated: redirect to `/signup?returnTo=/results/[id]&autoSave=true`
3. After signup (auto sign-in), redirect back to results page
4. Results page detects `autoSave=true` query param and triggers save action
5. This avoids storing pending saves in localStorage or cookies

### Anti-Patterns to Avoid
- **Don't use Edge Runtime for proxy.ts:** Next.js 16 proxy runs on Node.js runtime only. Edge is deprecated for this purpose.
- **Don't validate sessions only in proxy:** Cookie presence check in proxy is optimistic only. Always validate sessions server-side in server components and server actions for protected operations.
- **Don't create a custom session table:** Better Auth manages its own session, user, account, and verification tables. The `saved_searches` table is the only custom table needed.
- **Don't hash passwords manually:** Better Auth handles password hashing internally (uses bcrypt by default via Scrypt for portability).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom bcrypt/argon2 setup | Better Auth built-in | Handles salt generation, timing-safe comparison, configurable rounds |
| Session management | Custom JWT + cookie logic | Better Auth database sessions | Handles token rotation, CSRF protection, expiration, cookie security flags |
| Rate limiting | Custom Redis counter logic | @upstash/ratelimit | Sliding window math is tricky (boundary conditions), library handles atomicity and cleanup |
| Auth form validation | Custom email/password regex | Zod schemas + Better Auth validation | Better Auth validates password length; use zod for client-side form UX |
| CSRF protection | Custom token generation | Better Auth built-in | Automatically included in auth endpoints |

**Key insight:** Authentication is the single most dangerous area to hand-roll. A single bug in session management, password storage, or token handling creates a security vulnerability. Better Auth is battle-tested for these exact concerns.

## Common Pitfalls

### Pitfall 1: Better Auth Schema vs Existing Drizzle Schema
**What goes wrong:** Better Auth generates its own schema file, which may conflict with the existing `schema.ts` that defines `searches` and `migrations` tables.
**Why it happens:** `npx auth@latest generate` creates a new schema file; developers may accidentally overwrite or separate schemas.
**How to avoid:** Run `npx auth@latest generate` to get the auth schema, then MERGE the generated tables (user, session, account, verification) into the existing `src/lib/db/schema.ts`. Keep all tables in one file. Pass the full schema to the Drizzle adapter.
**Warning signs:** "Table not found" errors when Better Auth tries to query.

### Pitfall 2: Cookie Handling in Server Actions
**What goes wrong:** Sign-in/sign-up via server actions doesn't persist the session cookie, so the user appears logged out after the action completes.
**Why it happens:** React Server Components and server actions can't set cookies directly. The response headers aren't forwarded.
**How to avoid:** Use the `nextCookies()` plugin in Better Auth config. This is mandatory for Next.js server action flows.
**Warning signs:** User signs up successfully but is immediately shown as logged out.

### Pitfall 3: Rate Limiting with Null Redis Client
**What goes wrong:** Rate limiting silently fails when Redis env vars are missing (local dev), allowing unlimited requests.
**Why it happens:** The existing `redis.ts` returns `null` when env vars are missing. `@upstash/ratelimit` requires a Redis instance.
**How to avoid:** Create rate limiter conditionally -- if Redis is null, skip rate limiting (allow all requests in dev). Use a wrapper function that checks for the rate limiter's existence.
**Warning signs:** Rate limiting works in production but not locally; or crashes locally because Redis is null.

### Pitfall 4: proxy.ts Location in Next.js 16
**What goes wrong:** Proxy doesn't run because the file is in the wrong location.
**Why it happens:** Next.js 16 renamed middleware.ts to proxy.ts. It must export a function named `proxy` (not `middleware`). File goes in project root or `src/` root (same as old middleware.ts).
**How to avoid:** Place at `src/proxy.ts` (since this project uses `src/` directory). Export `async function proxy(request)`. Add `config.matcher` to scope it.
**Warning signs:** Rate limiting and auth redirects don't fire at all.

### Pitfall 5: Search Rate Limit -- Proxy vs Server Action
**What goes wrong:** Rate limiting in proxy.ts only catches page navigations, not direct server action calls.
**Why it happens:** Server actions POST to the same page URL, which may or may not match proxy matchers. The actual search execution is in `searchAction()`.
**How to avoid:** Implement rate limiting in TWO places: (1) proxy.ts for auth endpoint brute-force protection, (2) directly in the `searchAction()` server action for search rate limits. The server action can check auth state and apply the appropriate limit (3/day guest vs 50/hour authenticated).
**Warning signs:** Users bypass rate limits by calling the server action directly.

### Pitfall 6: Auto-Save After Signup Redirect Loop
**What goes wrong:** User signs up from the "save search" flow but the search doesn't auto-save, or the redirect loops.
**Why it happens:** The return URL and auto-save intent need to survive the signup flow. If using query params, they may get lost during Better Auth's callback redirect.
**How to avoid:** Use `callbackURL` parameter in `authClient.signUp.email()` to set the return path (e.g., `/results/[id]?autoSave=true`). The results page checks for the `autoSave` param on mount and triggers the save.
**Warning signs:** User ends up on a different page after signup, or search isn't saved.

## Code Examples

### Better Auth Route Handler
```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```
Source: https://better-auth.com/docs/integrations/next

### Database Schema Extension
```typescript
// Added to src/lib/db/schema.ts alongside existing tables
// These tables are generated by `npx auth@latest generate` and merged in

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  // ... additional fields generated by Better Auth CLI
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// Custom table for saved searches
export const savedSearches = sqliteTable("saved_searches", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  searchId: text("search_id").notNull().references(() => searches.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### Rate Limiter Setup
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./cache/redis";

// Only create rate limiters if Redis is available
export const searchGuestLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      prefix: "rl:search:guest",
    })
  : null;

export const searchAuthLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"),
      prefix: "rl:search:auth",
    })
  : null;

export const authEndpointLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"),
      prefix: "rl:auth:endpoint",
    })
  : null;
```
Source: https://github.com/upstash/ratelimit-js

### Rate Limiting in Search Action
```typescript
// Pattern for integrating rate limiting into existing searchAction
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { searchGuestLimiter, searchAuthLimiter } from "@/lib/rate-limit";

// Inside searchAction, before the main logic:
const session = await auth.api.getSession({ headers: await headers() });
const limiter = session ? searchAuthLimiter : searchGuestLimiter;
const identifier = session ? session.user.id : (headers().get("x-forwarded-for") ?? "anonymous");

if (limiter) {
  const { success, reset } = await limiter.limit(identifier);
  if (!success) {
    const minutesLeft = Math.ceil((reset - Date.now()) / 60000);
    return session
      ? { error: `Slow down -- try again in ${minutesLeft} minutes.` }
      : { error: "rate_limited", minutesLeft }; // UI shows sign-up CTA
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lucia Auth | Better Auth (or Auth.js v5) | March 2025 | Lucia deprecated; Better Auth is the recommended successor |
| middleware.ts | proxy.ts | Next.js 16 (2025) | Same functionality, renamed export, Node.js runtime only |
| Edge Runtime middleware | Node.js proxy | Next.js 16 | Edge deprecated for proxy; use Node.js runtime |
| next-auth (v4) | Auth.js (v5) or Better Auth | 2024-2025 | Auth.js v5 is a full rewrite; Better Auth emerged as simpler alternative |

**Deprecated/outdated:**
- Lucia v3: Deprecated March 2025. Now just a learning resource.
- middleware.ts: Deprecated in Next.js 16. Rename to proxy.ts with `proxy` export.
- Edge Runtime for middleware: Not supported in Next.js 16 proxy.

## Open Questions

1. **Better Auth schema generation with existing Drizzle schema**
   - What we know: `npx auth@latest generate` creates auth tables. We need to merge them into existing schema.ts.
   - What's unclear: Exact column definitions may vary by Better Auth version. The CLI output format needs to be verified at implementation time.
   - Recommendation: Run the CLI, inspect output, merge manually into schema.ts, then run `drizzle-kit push`.

2. **Password hashing algorithm in Better Auth**
   - What we know: Better Auth handles password hashing internally. It uses Scrypt by default for portability.
   - What's unclear: Whether argon2 can be configured as an alternative (not critical for v1).
   - Recommendation: Use the default Scrypt. It's secure and requires no additional native dependencies.

3. **Upstash Redis type compatibility with @upstash/ratelimit**
   - What we know: Both `@upstash/redis` and `@upstash/ratelimit` are from Upstash. The existing Redis client uses `new Redis({ url, token })`.
   - What's unclear: Whether the existing `redis` instance can be passed directly to `new Ratelimit({ redis })` or if `Redis.fromEnv()` is required.
   - Recommendation: The existing `redis` instance should work directly since it's the same `@upstash/redis` `Redis` type. Verify at implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test` (vitest run) |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | User can sign up with email/password | unit | `npx vitest run src/lib/__tests__/auth.test.ts -t "signup"` | No -- Wave 0 |
| AUTH-02 | Session persists across browser sessions | integration | Manual -- requires browser session | N/A manual |
| AUTH-03 | User can log out | unit | `npx vitest run src/lib/__tests__/auth.test.ts -t "signout"` | No -- Wave 0 |
| SAVE-01 | Auth user can save a search | unit | `npx vitest run src/actions/__tests__/saved-searches.test.ts -t "save"` | No -- Wave 0 |
| SAVE-02 | Auth user can view saved searches | unit | `npx vitest run src/actions/__tests__/saved-searches.test.ts -t "list"` | No -- Wave 0 |
| SAVE-03 | Auth user can delete a saved search | unit | `npx vitest run src/actions/__tests__/saved-searches.test.ts -t "delete"` | No -- Wave 0 |
| PRIV-02 | Rate limiting prevents abuse | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | No -- Wave 0 |
| PRIV-03 | ToS and privacy pages exist | unit | `npx vitest run src/app/__tests__/legal-pages.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test && npm run build`
- **Phase gate:** Full suite green + manual auth flow verification

### Wave 0 Gaps
- [ ] `src/lib/__tests__/auth.test.ts` -- covers AUTH-01, AUTH-03 (mock Better Auth)
- [ ] `src/actions/__tests__/saved-searches.test.ts` -- covers SAVE-01, SAVE-02, SAVE-03
- [ ] `src/lib/__tests__/rate-limit.test.ts` -- covers PRIV-02
- [ ] `src/app/__tests__/legal-pages.test.tsx` -- covers PRIV-03 (renders without error)

## Sources

### Primary (HIGH confidence)
- Better Auth Next.js integration: https://better-auth.com/docs/integrations/next
- Better Auth basic usage (email/password): https://better-auth.com/docs/basic-usage
- Better Auth Drizzle adapter: https://better-auth.com/docs/adapters/drizzle
- Better Auth database concepts: https://better-auth.com/docs/concepts/database
- @upstash/ratelimit GitHub: https://github.com/upstash/ratelimit-js
- Next.js 16 proxy documentation: https://nextjs.org/docs/app/getting-started/proxy

### Secondary (MEDIUM confidence)
- Auth.js async SQLite client issues: https://github.com/nextauthjs/next-auth/issues/8335, https://github.com/nextauthjs/next-auth/issues/9276
- Lucia deprecation: https://lucia-auth.com/lucia-v3/migrate
- Upstash rate limiting blog: https://upstash.com/blog/nextjs-ratelimiting

### Tertiary (LOW confidence)
- Better Auth + Turso libsql GitHub issue: https://github.com/better-auth/better-auth/issues/5391 (indicates active development, need to verify current status at implementation time)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Better Auth is well-documented with explicit Drizzle + SQLite support; @upstash/ratelimit is from the same vendor as existing Redis setup
- Architecture: HIGH - Patterns follow official Better Auth + Next.js 16 docs; proxy.ts pattern is documented
- Pitfalls: HIGH - Cookie handling, schema merging, and rate limit bypass are well-known issues documented in GitHub issues and official docs

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days -- stable ecosystem)
