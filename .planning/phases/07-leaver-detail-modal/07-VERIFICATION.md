---
phase: 07-leaver-detail-modal
verified: 2026-03-11T20:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Verify role hover underline and modal open on click"
    expected: "Hovering role shows underline + pointer cursor; clicking opens Dialog with correct header"
    why_human: "Visual hover/click behavior cannot be verified via static code analysis"
  - test: "Verify vertical timeline rendering with 3-state dots"
    expected: "Black dot for current position, blue for source company, open for other history"
    why_human: "Color and layout rendering requires visual inspection"
  - test: "Verify auth-gated content: blurred name and frosted overlay for unauthenticated users"
    expected: "First leaver name blurred, remaining behind frosted glass with sign-up CTA"
    why_human: "Blur/frosted glass visual effects require browser rendering"
  - test: "Verify modal on mobile viewport renders as bottom sheet"
    expected: "On viewport < 640px, modal fixed to bottom with rounded top corners"
    why_human: "Responsive layout requires device/viewport testing"
  - test: "Verify Show N more button and full leaver list for authenticated users"
    expected: "First 3 leavers visible, button shows remaining count, clicking reveals all"
    why_human: "Interactive state toggling requires runtime testing"
---

# Phase 7: Leaver Detail Modal Verification Report

**Phase Goal:** Users can drill from role names into individual leaver details, with personal information gated behind authentication
**Verified:** 2026-03-11T20:00:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Roles in company cards are visually clickable (hover underline, cursor pointer, full row) | VERIFIED | `role-list.tsx` lines 70-73: `cursor-pointer hover:underline`, onClick on outer div wrapping dot + name + count |
| 2 | Clicking a role opens a Dialog modal showing individual leavers | VERIFIED | `results-dashboard.tsx` manages `modalState`, passes to `LeaverModal`; modal uses shadcn Dialog in controlled mode |
| 3 | Modal header shows 'Role @ Company' and transition count | VERIFIED | `leaver-modal.tsx` lines 93-98: `{role} @ {company}` in DialogTitle, count in DialogDescription |
| 4 | Each leaver displays vertical timeline with filled/open/blue circle dots | VERIFIED | `leaver-timeline.tsx` lines 34-43: 3-state dot system (primary=current, blue=source, open=other) |
| 5 | Authenticated users see names/LinkedIn; unauthenticated see blurred placeholders with sign-up CTA | VERIFIED | `leaver-modal.tsx` LeaverCard (lines 159-201): auth check renders name or blur; `auth-gate-overlay.tsx` renders frosted overlay with `/signup?returnTo=` link |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/actions/leavers.ts` | Auth-aware server action | VERIFIED | 101 lines, exports `getLeaversForMigration` with session check, PII omitted (not nulled) for unauth |
| `src/actions/__tests__/leavers.test.ts` | Test suite | VERIFIED | 192 lines, 7 test behaviors covering auth/unauth, PII, positions, empty state |
| `src/components/results/leaver-modal.tsx` | Dialog wrapper (min 60 lines) | VERIFIED | 201 lines, controlled Dialog with race-condition-safe fetching, auth-aware rendering |
| `src/components/results/leaver-timeline.tsx` | Vertical timeline (min 30 lines) | VERIFIED | 58 lines, 3-state dot colors, date range formatting |
| `src/components/results/auth-gate-overlay.tsx` | Frosted glass CTA (min 20 lines) | VERIFIED | 27 lines, backdrop-blur-md, Lock icon, Link to /signup with returnTo |
| `src/components/results/role-list.tsx` | Updated with onRoleClick | VERIFIED | 98 lines, contains `onRoleClick` prop, `migrationIds` map, role="button", keyboard handler |
| `src/app/privacy/page.tsx` | Individual Career Data section | VERIFIED | Contains "Individual Career Data" heading |
| `src/lib/sankey-data.ts` | MigrationRecord with `id` field | VERIFIED | `id: string` is first field in MigrationRecord interface |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `leavers.ts` | `db/schema.ts` | Drizzle query on leavers + leaverPositions | WIRED | `db.query.leavers.findMany` with `eq(leavers.migrationId, migrationId)` |
| `leavers.ts` | `auth.ts` | `auth.api.getSession` for PII gating | WIRED | Line 46: `auth.api.getSession({ headers: await headers() })` |
| `results/[id]/page.tsx` | `results-dashboard.tsx` | migration ID in data mapping | WIRED | Line 81: `id: r.id` in migrationData mapping, passed as `migrations` prop |
| `role-list.tsx` | `leaver-modal.tsx` | onRoleClick callback chain | WIRED | RoleList -> CompanyCard -> CompanyGrid -> ResultsDashboard (handleRoleClick) -> LeaverModal |
| `leaver-modal.tsx` | `leavers.ts` | getLeaversForMigration on open | WIRED | Line 64: `getLeaversForMigration(currentId)` in useEffect |
| `auth-gate-overlay.tsx` | `/signup` | Link with returnTo param | WIRED | Line 20: `href={/signup?returnTo=${encodeURIComponent(returnTo)}}` |
| `leaver-modal.tsx` | `auth-client.ts` | useSession for client auth | WIRED | Line 49: `authClient.useSession()` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LVRD-01 | Plan 02 | Roles visually clickable | SATISFIED | `role-list.tsx`: hover underline, cursor-pointer, role="button" |
| LVRD-02 | Plan 02 | Clicking role opens modal with leavers | SATISFIED | Dialog opens via `handleRoleClick` -> `setModalState` -> `LeaverModal` |
| LVRD-03 | Plan 02 | Modal shows transition date and career history | SATISFIED | `leaver-timeline.tsx` renders positions with dates; modal shows timeline per leaver |
| LVRD-04 | Plan 01, 02 | Auth users see name + LinkedIn | SATISFIED | Server action includes PII when authenticated; modal renders name + LinkedIn link |
| LVRD-05 | Plan 02 | Unauth see blurred + CTA | SATISFIED | Blurred "Full Name Available" span; AuthGateOverlay with sign-up link |
| LVRD-06 | Plan 01 | Leaver data stored during search | SATISFIED | Server action queries leavers/leaverPositions tables linked to migrations |
| PRIV-04 | Plan 01 | Privacy policy covers individual data | SATISFIED | "Individual Career Data" section in privacy page |
| PRIV-05 | Plan 01 | PII stripped server-side for unauth | SATISFIED | `leavers.ts` lines 85-93: PublicLeaver object constructed without name/linkedinUrl fields |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `leavers.ts` | 54-56 | Silent catch returning empty results | Info | Intentional for local dev without tables; logged nowhere |
| `leaver-timeline.tsx` | 10 | `return null` for empty positions | Info | Correct guard clause, not a stub |

No blockers or warnings found.

### Human Verification Required

### 1. Role Click Interaction

**Test:** Hover over roles in company cards, then click one
**Expected:** Underline appears on hover with pointer cursor; clicking opens Dialog with "Role @ Company" header and count
**Why human:** Visual hover/click behavior requires browser interaction

### 2. Timeline Visual Rendering

**Test:** Open a leaver modal and inspect timeline dots
**Expected:** Black filled dot for current position, blue filled dot for source company positions, open dot for other history
**Why human:** Color differentiation and vertical line alignment need visual inspection

### 3. Auth-Gated Content

**Test:** View modal while logged out, then log in and view again
**Expected:** Logged out: first leaver name blurred, rest behind frosted glass with CTA. Logged in: all names and LinkedIn links visible
**Why human:** Blur effect, frosted glass overlay, and auth state transitions require runtime testing

### 4. Mobile Bottom Sheet

**Test:** Open modal on viewport < 640px
**Expected:** Modal renders fixed to bottom, full width, rounded top corners, no rounded bottom
**Why human:** Responsive CSS breakpoint behavior requires device testing

### 5. Show More Interaction

**Test:** Open modal for a migration with > 3 leavers (while authenticated)
**Expected:** First 3 leavers visible, "Show N more" button, clicking reveals remaining leavers
**Why human:** Interactive state toggling and count accuracy require runtime verification

### Gaps Summary

No gaps found. All 8 requirements (LVRD-01 through LVRD-06, PRIV-04, PRIV-05) are satisfied with substantive, wired implementations. All artifacts exist at expected paths, exceed minimum line counts, and are properly connected through the component chain.

The only items needing attention are the 5 human verification tests above, which cover visual rendering, interactive behavior, and responsive layout that cannot be confirmed through static analysis.

---

_Verified: 2026-03-11T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
