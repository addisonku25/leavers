---
phase: 7
slug: leaver-detail-modal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library 16.3.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 7-01-01 | 01 | 1 | LVRD-04, LVRD-05, PRIV-05 | unit | `npx vitest run src/actions/__tests__/leavers.test.ts` | ❌ W0 | ⬜ pending |
| 7-01-02 | 01 | 1 | LVRD-01 | unit (RTL) | `npx vitest run src/components/results/__tests__/role-list.test.tsx -t "clickable"` | ❌ W0 | ⬜ pending |
| 7-01-03 | 01 | 1 | LVRD-02 | integration (RTL) | `npx vitest run src/components/results/__tests__/leaver-modal.test.tsx` | ❌ W0 | ⬜ pending |
| 7-01-04 | 01 | 1 | LVRD-03 | unit (RTL) | `npx vitest run src/components/results/__tests__/leaver-timeline.test.tsx` | ❌ W0 | ⬜ pending |
| 7-01-05 | 01 | 1 | PRIV-04 | unit (RTL) | `npx vitest run src/app/__tests__/legal-pages.test.tsx -t "individual"` | Partial | ⬜ pending |
| 7-01-06 | 01 | 1 | LVRD-06 | unit | `npx vitest run src/lib/__tests__/search-action.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/actions/__tests__/leavers.test.ts` — stubs for LVRD-04, LVRD-05, PRIV-05 (server action PII stripping)
- [ ] `src/components/results/__tests__/role-list.test.tsx` — stubs for LVRD-01 (clickable roles)
- [ ] `src/components/results/__tests__/leaver-modal.test.tsx` — stubs for LVRD-02 (modal opens with leaver data)
- [ ] `src/components/results/__tests__/leaver-timeline.test.tsx` — stubs for LVRD-03 (timeline rendering)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Modal responsive: sheet on mobile, dialog on desktop | LVRD-02 | Viewport-dependent CSS | Resize browser below/above 640px; verify sheet vs centered overlay |
| Fade + scale animation on modal open | LVRD-02 | Animation timing visual check | Open modal; verify ~200ms fade + scale-up |
| Frosted glass overlay visual quality | LVRD-05 | Visual effect quality | View as unauthenticated; verify backdrop-blur effect on remaining leavers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
