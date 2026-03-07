# Feature Landscape: v1.1 Deep Dive Drill-Down

**Domain:** Interactive data visualization drill-down for career migration dashboard
**Researched:** 2026-03-07
**Builds on:** v1.0 (search, company cards, Sankey diagram, insights, auth, saved searches)

## Existing Foundation

These are already built and working. The v1.1 features layer on top of them.

| Existing Component | Current State | Relevant to Drill-Down |
|---|---|---|
| Sankey diagram | Hover highlights connected nodes/links, no click behavior | Click targets already exist (cursor-pointer class on nodes) |
| Company cards grid | Static grid sorted by count, no interaction beyond expand/collapse roles | Needs to accept highlight/promote state from Sankey clicks |
| Role list in cards | Displays role name + count + seniority dot, expand/collapse for 5+ roles | Roles need to become clickable triggers for detail modal |
| Auth system | Better Auth with email/password, session management | Can gate modal content (name, LinkedIn) behind auth check |
| Dialog component | shadcn/ui Dialog already installed (`src/components/ui/dialog.tsx`) | Ready to use for leaver detail modal |
| Data model | `migrations` table stores aggregate counts per destination company/role | Needs expansion: individual leaver records with career history, dates, LinkedIn URLs |

## Table Stakes

Features users expect from an interactive drill-down. Missing any of these makes the interaction feel broken or pointless.

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Sankey node click scrolls to matching card(s) | Standard drill-down pattern: click an element in an overview visualization, page navigates to the detail. Users already see cursor-pointer on Sankey nodes -- clicking and nothing happening is a broken affordance. | Low | Requires `ref` on each company card + `scrollIntoView` call. CompanyGrid needs to accept a highlighted company ID. |
| Visual highlight on targeted card(s) | When scrolled-to, the card must visually distinguish itself. Without highlight, scroll alone is disorienting -- user doesn't know which card the diagram pointed to. Ring/glow + brief animation is the standard pattern. | Low | CSS transition class toggled by state. 2-3 second auto-dismiss or persist until next click. |
| Promote matching card(s) to top of grid | If a user clicks a company node in the Sankey and the matching card is 15th in the grid, scrolling past 14 cards feels wrong. Reordering puts the relevant card first. | Medium | CompanyGrid needs sort-override state. Must animate reorder (not jump) or users lose spatial context. |
| Sankey role node click filters/highlights cards containing that role | Role nodes in the rightmost Sankey column should highlight all company cards that contain that destination role. Shows "which companies hire for this role?" | Medium | Requires cross-referencing role node name against CompanyCardData.roles. Multiple cards may highlight simultaneously. |
| Clickable roles in company cards | Roles currently display as plain text with counts. Users exploring career paths expect to click a role to see who made that transition. Visual affordance (underline, hover state, or button styling) is mandatory. | Low | Change `<span>` to `<button>` in RoleList. Add hover/focus styles. |
| Leaver detail modal on role click | The whole point of drill-down: see individual leavers behind the aggregate count. Modal is the right pattern (maintains page context, avoids route change for a quick peek). | Medium | New modal component using shadcn Dialog. Needs data source for individual leaver records. |
| Transition date in leaver detail | When someone left tells the user about recency and relevance. "This person left 6 months ago" vs "3 years ago" changes the signal. | Low | Requires `transitionDate` field in data model. Display as relative time ("6 months ago") with exact date on hover. |
| Career history timeline in leaver detail | A list of roles isn't enough -- users want to see the trajectory. "They went from IC to Manager to Director" tells a story that a single destination role doesn't. | Medium | Requires array of career positions per leaver. Vertical timeline UI (simple, not fancy). |

## Differentiators

Features that elevate the drill-down beyond basic click-to-see-detail.

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Auth-gated name and LinkedIn in modal | Progressive disclosure: show anonymous career trajectory to everyone, reveal identity (name + LinkedIn link) only to logged-in users. This is the monetization lever and the incentive to create an account. Blurred text with "Sign in to see" overlay is the standard pattern. | Medium | Auth state check in modal. Blur CSS + overlay CTA. Must not feel punitive -- the anonymous data should still be valuable on its own. |
| Bidirectional Sankey-card sync | When a user clicks a company card, the Sankey diagram highlights the corresponding node and its connected links. Two-way binding between viz and cards creates a cohesive exploration experience. | Medium | Requires lifting highlight state to ResultsDashboard and passing it down to both Sankey and CompanyGrid. |
| Keyboard navigation in Sankey | Arrow keys to move between nodes, Enter to trigger drill-down. Makes the diagram accessible and power-user friendly. | Medium | SVG focus management, tabIndex on node groups, keyDown handlers. ARIA roles for accessibility. |
| Animated card reorder | When cards reorder due to Sankey click, use layout animation (CSS or Framer Motion) so cards visually slide into position rather than jumping. Prevents spatial disorientation. | Low-Med | Framer Motion `layoutId` or CSS `view-transition` (newer browsers). Could use `key` prop trick with simpler CSS transitions. |
| Leaver count badge on role click target | Show "3 people" badge on the role button, distinct from the existing count badge, to signal that clicking reveals individual profiles. | Low | UI-only change, data already available from `count` field. |

## Anti-Features

Features to explicitly NOT build for v1.1. Each is a scope trap.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full-page leaver profile routes | Creating `/leaver/[id]` routes adds routing complexity, requires SEO decisions, and breaks the exploration flow. Users want a quick peek, not a page navigation. | Use modal (Dialog). If deep-linking to a specific leaver becomes needed later, add it in a future version. |
| Inline editing of leaver data | Users might want to "correct" data. This creates a moderation nightmare and data integrity issues. | Read-only display. If data corrections are needed, build a separate admin flow later. |
| Social features on leaver profiles | "Connect with this person" or "Message" buttons. This is LinkedIn's territory. | Show LinkedIn link (auth-gated). Let users take the action on LinkedIn itself. |
| Complex filtering UI on results page | Filter by date range, seniority, company size, industry. Over-engineers the exploration before validating that basic drill-down is useful. | Start with Sankey node clicks as the primary filter mechanism. Add explicit filters only if user feedback demands it. |
| Animated Sankey transitions | Animating the Sankey diagram nodes/links when filtering or highlighting adds significant SVG animation complexity for marginal UX gain. | Use opacity transitions (already partially implemented with hover). Avoid path morphing or node repositioning animations. |
| Nested modals for career history entries | Clicking a career history item in the leaver modal opens another modal. Nested modals are disorienting and hard to manage. | Career history is displayed inline within the single leaver detail modal. No further drill-down. |

## Feature Dependencies

```
                    DATA MODEL EXPANSION
                    (individual leavers table)
                           |
              +------------+------------+
              |                         |
    Leaver Detail Modal          Career History Timeline
              |                         |
              +------------+------------+
                           |
                Auth-Gated Content (name + LinkedIn)
                (depends on modal existing + auth system)


    SANKEY NODE CLICK HANDLER
              |
    +----+----+----+
    |    |         |
  Scroll  Highlight  Promote Card
  to Card  Card       to Top
    |         |         |
    +----+----+----+----+
              |
    Bidirectional Sankey-Card Sync
    (depends on both directions working)


    CLICKABLE ROLES IN CARDS
              |
    Leaver Detail Modal
    (roles are the trigger, modal is the target)
```

**Critical path:** Data model expansion must come first. Without individual leaver records, the modal has nothing to show. The Sankey interaction features and the modal features are independent tracks that can be built in parallel.

## Implementation Sequence Recommendation

### Phase A: Data Foundation + Sankey Interactions (can run in parallel)

**Track 1 -- Data model:**
1. New `leavers` table (individual records with career history, transition dates, LinkedIn URLs)
2. Update DataProvider interface to return individual leaver data
3. Update mock provider to generate individual leavers
4. Migration from aggregate-only to aggregate + individual data

**Track 2 -- Sankey click-to-card:**
1. Add onClick handler to Sankey company nodes
2. Lift highlight state to ResultsDashboard
3. CompanyGrid accepts highlighted company, scrolls and highlights
4. Card promote-to-top with animation
5. Sankey role node click highlights matching cards

### Phase B: Modal + Auth Gating

1. Clickable roles in RoleList (visual affordance change)
2. Leaver detail modal (shadcn Dialog)
3. Career history timeline in modal
4. Auth-gated name + LinkedIn with blur/overlay pattern
5. Bidirectional Sankey-card sync (if time permits)

### Defer:
- Keyboard navigation in Sankey (accessibility pass later)
- Complex filtering UI
- Deep-link routes for individual leavers

## UX Pattern Notes

### Sankey Click Behavior

The standard pattern for Sankey diagram interaction (established by tools like Google Charts, Flourish, JointJS, and enterprise analytics platforms) is:

1. **Hover** highlights connected paths (already implemented)
2. **Click** isolates the node's connections and triggers a related action (scroll, filter, or drill-down)
3. **Click elsewhere** or **click same node again** resets to default state

For Leavers, click on a company node should: highlight the node in the Sankey (persistent, not just hover), smooth-scroll to the company card section, promote the matching card to position 1, and apply a highlight ring. Click on a role node should: highlight all company cards containing that role and dim the others.

### Modal Detail Pattern

The established pattern for data point detail modals:

1. **Trigger:** Clickable element with clear affordance (not just cursor change -- needs visual distinction like underline or button styling)
2. **Modal content:** Header with context ("Solution Engineers who went to Google as Account Executives"), then detail body
3. **Progressive disclosure:** Show the most important information immediately (career trajectory), gate secondary information (identity) behind auth
4. **Dismissal:** Click overlay, press Escape, or click X button (shadcn Dialog handles all three)

### Auth-Gated Content in Modal

The standard freemium blur pattern:

1. Show the structure of gated content (user can see there IS a name and LinkedIn link)
2. Apply CSS blur (4-8px) to the actual content
3. Overlay a semi-transparent card with CTA: "Sign in to see full profile"
4. After auth, content unblurs with a brief transition
5. Critical: the ungated content (career history, dates) must be valuable enough on its own that the gate feels like a bonus, not a punishment

This avoids the anti-pattern of "we showed you nothing useful, now pay us." The career trajectory is the core value; the identity is the bonus for authenticated users.

## Sources

- [Google Charts Sankey Diagram Interaction](https://developers.google.com/chart/interactive/docs/gallery/sankey) -- standard click/hover behaviors
- [JointJS Sankey Demo](https://www.jointjs.com/demos/sankey-diagram) -- node dragging and path highlighting
- [NN/g Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) -- authoritative UX pattern reference
- [IxDF Progressive Disclosure (2026)](https://ixdf.org/literature/topics/progressive-disclosure) -- updated pattern guidance
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/radix/dialog) -- modal component already in use
- [UI Patterns: Paywall](https://ui-patterns.com/patterns/Paywall) -- freemium content gating patterns
- [Elijah Meeks: Alluvial Charts and Their Discontents](https://medium.com/@Elijah_Meeks/alluvial-charts-and-their-discontents-10a77d55216b) -- Sankey/alluvial interaction design critique
- [Dev3lop: Progressive Disclosure in Complex Visualization Interfaces](https://dev3lop.com/progressive-disclosure-in-complex-visualization-interfaces/) -- visualization-specific progressive disclosure
