# Domain Pitfalls

**Domain:** Interactive drill-down features for career migration dashboard (v1.1)
**Researched:** 2026-03-07
**Focus:** Adding click interactions, animated reordering, auth-gated modals, schema expansion, and privacy/legal risks to an existing v1.0 system

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or legal exposure.

### Pitfall 1: SVG Click Handlers Competing with Hover State

**What goes wrong:** The existing Sankey diagram uses `onMouseEnter` on node `<g>` elements and `onMouseLeave` on the root `<svg>` to manage hover highlighting. Adding `onClick` to the same elements creates a conflict: on touch devices, `mouseenter` fires before `click`, meaning the first tap highlights and the second tap clicks. On desktop, clicking a node triggers the scroll-to behavior while the hover state remains, leaving the diagram in a visually confusing half-highlighted state after the viewport scrolls away from it.

**Why it happens:** The current component manages hover via `hoveredNode` state (line 64 of `sankey-diagram.tsx`). Click would need a separate `selectedNode` state. Two independent highlight states (hover + selected) fight over opacity values in `getNodeOpacity` and `getLinkOpacity`. The existing `pointer-events-none` on link paths (line 197) is correct for hover but means links cannot be clicked -- this is fine but must remain intentional.

**Consequences:** Touch devices become unusable. Desktop users see stale highlights. The component re-renders on every hover AND click, potentially causing layout thrash if click triggers parent state changes (card promotion/scrolling).

**Prevention:**
- Add a separate `selectedNode` state distinct from `hoveredNode`. Selected takes visual priority over hover.
- On click, set `selectedNode` AND call the parent callback. Clear `selectedNode` on a second click (toggle) or when a different node is clicked.
- On touch devices, suppress hover entirely. Use `onPointerDown` with `pointerType` check instead of splitting mouse/touch paths.
- Do NOT add `onClick` to links -- only nodes are meaningful click targets.

**Detection:** Test on a real touch device (or Chrome DevTools touch emulation). If the first tap highlights and doesn't fire the click callback, you have this bug.

**Phase:** Must be addressed in the Sankey interaction phase. Get click working in isolation before wiring to card promotion.

### Pitfall 2: Drizzle `push` Data Loss When Adding Columns to SQLite

**What goes wrong:** `drizzle-kit push` for SQLite handles schema changes by creating a mirror table, copying data, dropping the original, and renaming. When adding columns to `migrations` (e.g., `leaver_name`, `linkedin_url`, `career_history`), the push command can fail to copy existing data if the column count changes, leaving an `__old_push_migrations` table with the data and an empty new table.

**Why it happens:** SQLite doesn't support `ALTER TABLE ADD COLUMN` with `NOT NULL` constraints unless a default is provided. Drizzle's push strategy for SQLite uses table recreation for many changes, and the data copy step has known bugs with column count mismatches (drizzle-orm issue #1313).

**Consequences:** All cached migration data is lost. Every previous search result returns empty. Users see broken results pages for previously-cached queries.

**Prevention:**
- Use `drizzle-kit generate` + `drizzle-kit migrate` (migration files) instead of `push` for production schema changes.
- Make ALL new columns nullable (no `NOT NULL` constraints) so SQLite can use simple `ALTER TABLE ADD COLUMN`.
- Add new columns to a NEW table (`leavers` or `leaver_details`) with a foreign key to `migrations`, rather than widening the existing `migrations` table. This avoids touching existing data entirely.
- Test the migration against a copy of the production database before running it.

**Detection:** After running push/migrate, verify row counts: `SELECT COUNT(*) FROM migrations` should match pre-migration count. Check for `__old_push_*` tables.

**Phase:** Must be the FIRST thing done in the schema expansion phase, before any feature code depends on the new columns. A separate `leavers` table is strongly recommended.

### Pitfall 3: Privacy/Legal Exposure from Displaying Individual Career Data

**What goes wrong:** Showing individual names and LinkedIn URLs -- even for authenticated users -- creates legal risk under GDPR (EU), CCPA/CPRA (California), and 20+ other US state privacy laws enacted by 2025. Scraping LinkedIn profiles for display violates LinkedIn's Terms of Service. Even displaying publicly-available data in aggregate can cross lines if it enables identification of specific individuals' career moves without their consent.

**Why it happens:** The instinct is "this data is public on LinkedIn, so we can show it." But GDPR considers any data that identifies a natural person as personal data, regardless of whether it was publicly posted. Repurposing it (scraping LinkedIn to power a different product) requires a lawful basis. LinkedIn's ToS explicitly prohibit automated data collection, and they moved much of the professional work history behind login walls in late 2025.

**Consequences:** LinkedIn sends a cease-and-desist or pursues legal action. GDPR fines up to 20M EUR or 4% of global revenue. CCPA enables individual right-to-delete requests, requiring infrastructure to handle them. App store / hosting providers may delist for ToS violations. Reputational damage if users feel surveilled.

**Prevention:**
- Auth-gate individual details (name + LinkedIn) as planned -- this is necessary but not sufficient.
- Add a clear privacy policy page (already exists at `/privacy`) that explains what data is shown and why.
- Implement a "request removal" mechanism so individuals can ask to have their data removed. This is not optional under GDPR/CCPA.
- Consider showing anonymized individual data (e.g., "Person 1 at Company X moved to Role Y at Company Z in March 2024") with LinkedIn links only if the data source provides opt-in consent.
- Consult a lawyer before launching with real LinkedIn data. The BrightData/ScrapIn providers already abstract the scraping, but the legal risk of displaying the data sits with you, not the data vendor.
- Store the minimum data needed. Do NOT cache full career histories if you only display transition data.

**Detection:** If you receive a single DMCA takedown or privacy complaint, you have this problem. Build the removal mechanism before it happens, not after.

**Phase:** Privacy architecture decisions must be made BEFORE the leaver detail modal is built. The modal's design depends on what you're legally allowed to show.

---

## Moderate Pitfalls

### Pitfall 4: Card Promotion/Reorder Causes Layout Thrash in CSS Grid

**What goes wrong:** The current `CompanyGrid` renders cards in a CSS grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). "Promoting" a clicked card to the top means reordering the `companies` array, which causes React to unmount and remount cards in different grid cells. Without animation, cards jump instantly. With naive animation (CSS transitions on `transform`), cards animate to wrong positions because CSS Grid assigns positions, not the developer.

**Why it happens:** CSS Grid controls element placement. When React re-renders with a new array order, the browser lays out elements in their new grid cells immediately. CSS `transform` transitions animate FROM the old transform value, but grid reflow already moved the element, so the animation starts from the wrong position.

**Prevention:**
- Use the FLIP technique (First, Last, Invert, Play): measure positions before reorder, let React re-render, calculate deltas, animate with `transform` from old to new position.
- Use `useLayoutEffect` (not `useEffect`) to measure and set initial transform before paint. This prevents the flash of elements in their new positions.
- Add `will-change: transform` or `contain: layout` to cards for compositor layer promotion.
- Consider Framer Motion's `<AnimatePresence>` + `layout` prop, which handles FLIP automatically. BUT: adding Framer Motion as a dependency for one animation is heavy (~30KB). A manual FLIP with `requestAnimationFrame` is lighter.
- **Recommended alternative:** don't animate the grid reorder. Just scroll to the card and add a highlight ring/pulse animation. This is simpler and arguably better UX -- users want to find the card, not watch cards dance around.

**Detection:** If promoted cards "teleport" or flash before animating, you have a FLIP measurement timing issue.

**Phase:** Card promotion phase. Decide animation strategy before implementation -- the "just highlight and scroll" approach avoids this pitfall entirely.

### Pitfall 5: `scrollIntoView` Race Condition with React State Updates

**What goes wrong:** When a Sankey node is clicked, the app needs to: (1) update state to promote/highlight a card, (2) wait for React to re-render with the card in its new position, (3) scroll to that card. If `scrollIntoView` is called synchronously after `setState`, it scrolls to where the card WAS, not where it WILL BE after re-render.

**Why it happens:** React state updates are asynchronous. `setState` + `ref.current.scrollIntoView()` in the same handler runs scroll before the DOM updates. Even `useEffect` may fire before layout is complete in some cases.

**Consequences:** Scroll lands on the wrong element or scrolls to an empty space. Users see the page jump to a random position.

**Prevention:**
- Use `useLayoutEffect` watching the promoted card state. When the promoted card changes, measure its position and call `scrollIntoView` from `useLayoutEffect`, which runs synchronously after DOM mutations but before paint.
- Pass a `ref` callback on the promoted card: `<CompanyCard ref={isPromoted ? scrollTargetRef : undefined} />`. In the ref callback, call `scrollIntoView`.
- Use `scrollIntoView({ behavior: "smooth", block: "nearest" })` -- `block: "nearest"` prevents unnecessary scrolling if the card is already visible.
- Add `scroll-margin-top` CSS to cards matching the navbar height so they don't scroll behind the fixed navbar.

**Detection:** Click a Sankey company node while scrolled to the top of the page. If the scroll overshoots or lands above/below the target card, you have this bug.

**Phase:** Must be solved in the same phase as Sankey click interactions.

### Pitfall 6: Modal Content Flash Before Auth Check Completes

**What goes wrong:** The leaver detail modal shows name + LinkedIn for authenticated users and a "sign in to see details" prompt for anonymous users. If the auth check is async (which it is -- Better Auth uses a session API call), there's a window where the modal opens, briefly shows a loading spinner or worse, flashes the gated content before hiding it.

**Why it happens:** Better Auth's `useSession()` hook makes a client-side request to verify the session. On first render, session state is `loading`. The modal renders during this loading state and either shows nothing (bad UX) or shows content that gets hidden once auth resolves (security issue).

**Consequences:** Anonymous users briefly see gated content (names/LinkedIn URLs) before the auth check hides it. Or authenticated users see an unnecessary loading spinner on every modal open.

**Prevention:**
- Pre-fetch auth state at the page level (in the results page server component or layout). Pass `isAuthenticated` as a prop to the modal, not as a client-side check inside the modal.
- The results page (`results/[id]/page.tsx`) already runs server-side -- check the session there and pass a boolean down. This means zero client-side auth latency in the modal.
- If the modal MUST check auth client-side, render a skeleton/placeholder during `loading` state, never the actual gated content. Use `session.status === "authenticated"` strictly.
- **Important:** the gated data (names, LinkedIn URLs) should not be in the page's initial server response for unauthenticated users. The modal should fetch this data separately via a server action that validates the session server-side. Never rely solely on client-side visibility toggling for security.

**Detection:** Open the modal while logged out in a slow network (Chrome DevTools throttle to "Slow 3G"). If you see a flash of name/LinkedIn data before it's hidden, you have a data leak.

**Phase:** Auth-gating phase. Decide server vs. client auth check before building the modal.

### Pitfall 7: Sankey Node Index Instability Across Re-renders

**What goes wrong:** The current Sankey diagram uses array indices as node identifiers (the `i` in `layout.nodes.map((node, i) =>`). If a click handler stores a node index and passes it to a parent component, and then the parent re-renders with different data (e.g., filtered migrations), the stored index now points to a different node or is out of bounds.

**Why it happens:** The `useMemo` that computes the Sankey layout deep-copies data and feeds it to d3-sankey, which assigns indices. If migrations data changes (unlikely in current v1, but possible with future filtering), nodes get different indices.

**Consequences:** Clicking a company node scrolls to the wrong company card. Or crashes with an undefined reference.

**Prevention:**
- Use node `name` + `category` as the stable identifier for click callbacks, not the array index. Example: `onClick={() => onNodeClick({ name: node.name, category: node.category })}`.
- The card promotion logic should match by company name, not by index.
- This is already partially correct in the current code (the `SankeyNode` type has `name` and `category`), but the click handler must explicitly use these, not `i`.

**Detection:** Add a test that clicks a Sankey company node and verifies the correct company card is highlighted, not just "the Nth card."

**Phase:** Sankey interaction phase, foundational to correct wiring.

---

## Minor Pitfalls

### Pitfall 8: d3-sankey Mutates Input Data

**What goes wrong:** The current code correctly deep-copies data before passing to d3-sankey (lines 103-106 of `sankey-diagram.tsx`). If a future refactor removes this copy (thinking it's unnecessary), d3-sankey mutates node and link objects in place, corrupting React props and causing stale/wrong renders on subsequent interactions.

**Prevention:** Keep the deep copy. Add a code comment explaining WHY it exists: `// d3-sankey mutates nodes/links in place -- must deep-copy to protect React props`. The click feature makes this more critical because selected state now persists across re-renders.

**Phase:** Any phase that touches Sankey data flow.

### Pitfall 9: Modal Focus Trap Conflicts with Scroll-to Origin

**What goes wrong:** If the leaver detail modal uses shadcn's `<Dialog>` (built on Radix UI), it traps focus inside the modal. But if the user reached the modal by clicking a role in a company card that was itself scrolled-to via a Sankey click, the focus return target (the role button) may be off-screen. On modal close, focus returns to an invisible element, and the page doesn't scroll back.

**Prevention:**
- On modal close, scroll the triggering card back into view if it's off-screen.
- Use shadcn Dialog's `onOpenChange` callback to handle scroll restoration.
- Test the full flow: Sankey click -> card scroll -> role click -> modal open -> modal close -> focus returns to role button -> card is visible.

**Phase:** Modal phase. Test the full click chain, not just the modal in isolation.

### Pitfall 10: New `leavers` Table Creates N+1 Query Problem

**What goes wrong:** If individual leaver data lives in a new table (recommended to avoid Pitfall 2), loading a results page now requires: (1) fetch search, (2) fetch migrations, (3) for each migration, fetch associated leavers. This is the classic N+1 query problem -- one query per company-role combination.

**Prevention:**
- Fetch leaver details only when the modal opens (lazy load), not on page load. The results page doesn't need individual names -- it only needs aggregate counts which already exist in `migrations`.
- When the modal opens for a specific role at a specific company, run a single query: `SELECT * FROM leavers WHERE search_id = ? AND destination_company = ? AND destination_role = ?`.
- Index the `leavers` table on `(search_id, destination_company, destination_role)`.

**Phase:** Schema expansion phase. Design the query pattern before building the table.

### Pitfall 11: Vercel 10-Second Timeout on Leaver Detail Fetch

**What goes wrong:** If leaver details aren't cached and need to be fetched from BrightData/ScrapIn on modal open, the request may exceed Vercel's free tier 10-second function timeout. The modal shows a loading state that never resolves.

**Prevention:**
- Fetch leaver details during the initial search, not on modal open. Store them alongside migrations during the original cache-miss fetch. The data provider already has the individual records -- it aggregates them into counts. Keep the individuals too.
- If that's too slow for the initial search, use a background job pattern: return the search results immediately, then fetch leaver details asynchronously and update the cache. Show "details loading..." in the modal with a polling mechanism.
- Consider upgrading to Vercel Pro ($20/month, 60-second timeout) if this becomes a real blocker.

**Phase:** Data provider phase. Decide when leaver details are fetched before building the modal that displays them.

### Pitfall 12: Shadcn Dialog Hydration Mismatch in Next.js

**What goes wrong:** Radix UI primitives (which shadcn Dialog wraps) rely on client-side state that can conflict with server-side rendering. If the dialog's open state is derived from URL params or server data, the server render and client render may disagree, causing a React hydration error that either breaks the dialog or logs noisy console warnings.

**Prevention:**
- Keep dialog open state purely client-side (local `useState`). Do not derive it from server data or URL params.
- If you want shareable modal URLs (e.g., `?leaver=123`), read the URL param in a `useEffect` to set dialog state after hydration, not during initial render.
- Use `dynamic(() => import('./leaver-modal'), { ssr: false })` as a last resort if hydration issues persist.

**Phase:** Modal implementation phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Sankey click interactions | Pitfall 1 (hover/click conflict), Pitfall 7 (index instability) | Separate hover/selected state; use name+category as identifier, not index |
| Card promotion/scroll | Pitfall 4 (grid layout thrash), Pitfall 5 (scroll race condition) | Use "highlight + scroll" over animated reorder; use useLayoutEffect for scroll timing |
| Leaver detail modal | Pitfall 6 (auth flash), Pitfall 9 (focus trap), Pitfall 12 (hydration) | Server-side auth check passed as prop; test full Sankey->card->modal->close flow |
| Schema expansion | Pitfall 2 (push data loss), Pitfall 10 (N+1 queries) | New `leavers` table with FK; nullable columns; lazy-load details on modal open |
| Privacy/legal | Pitfall 3 (legal exposure) | Decide what to show before building; add removal mechanism; consult lawyer |
| Data fetching | Pitfall 11 (Vercel timeout) | Fetch individual details during initial search, not on modal open |

---

## Sources

- [Drizzle ORM SQLite push data loss bug (issue #1313)](https://github.com/drizzle-team/drizzle-orm/issues/1313) -- confirmed data loss on column addition with push
- [Drizzle ORM Migrations docs](https://orm.drizzle.team/docs/migrations) -- migration files vs push strategy
- [React scrollIntoView timing issue (React #23396)](https://github.com/facebook/react/issues/23396) -- scrollIntoView called before DOM update
- [MDN scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) -- browser compatibility and options
- [shadcn/ui Dialog hydration fix](https://truecoderguru.com/blog/shadcn/fix-nextjs-shadcn-dialog-hydration) -- SSR hydration mismatch with Radix
- [How to scrape LinkedIn data legally (2025)](https://blog.closelyhq.com/how-to-scrape-linkedin-data-legally/) -- LinkedIn ToS, CFAA risks
- [LinkedIn GDPR page](https://privacy.linkedin.com/gdpr) -- GDPR data processing requirements
- [LinkedIn CCPA page](https://privacy.linkedin.com/usa) -- CCPA service provider status
- [FLIP animation technique for React list reordering](https://medium.com/ft-product-technology/animating-list-reordering-with-react-hooks-1aa0d78a24dc)
- [D3.js + React integration patterns](https://gist.github.com/alexcjohnson/a4b714eee8afd2123ee00cb5b3278a5f) -- DOM control conflicts
- [focus-trap-react](https://www.npmjs.com/package/focus-trap-react) -- modal focus trapping patterns
- [shadcn Dialog best practices](https://blog.greenroots.info/shadcn-dialog-with-form-three-tips) -- form integration and state management
