---
phase: 6
slug: sankey-click-interactions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library (jsdom) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | SANK-01, SANK-02, SANK-04 | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- W0 | pending |
| 06-01-02 | 01 | 0 | SANK-03 | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | No -- W0 | pending |
| 06-01-03 | 01 | 1 | SANK-01 | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- W0 | pending |
| 06-01-04 | 01 | 1 | SANK-02 | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- W0 | pending |
| 06-01-05 | 01 | 2 | SANK-03 | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | No -- W0 | pending |
| 06-01-06 | 01 | 2 | SANK-04 | unit | `npx vitest run src/components/results/__tests__/drill-down.test.tsx` | No -- W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/components/results/__tests__/drill-down.test.tsx` -- stubs for SANK-01, SANK-02, SANK-04 (reducer logic, context dispatch)
- [ ] `src/components/results/__tests__/company-grid.test.tsx` -- stubs for SANK-03 (motion wrapper presence, card ordering)
- [ ] Motion mock: `motion/react` must be mocked in jsdom tests since layout animations require real DOM measurements

*Existing test infrastructure (Vitest + RTL) is already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card layout animation smoothness | SANK-03 | Motion `layout` prop uses real DOM measurements; jsdom has no layout engine | 1. Click a company node in Sankey 2. Verify cards reorder with smooth animation (no jumps) 3. Verify ~400ms duration feels right |
| Scroll to section heading | SANK-01, SANK-02 | scrollIntoView behavior not testable in jsdom | 1. Click a Sankey node 2. Verify page smoothly scrolls to company cards section heading |
| Hover override of selection visual | SANK-01, SANK-02 | Visual state layering requires real rendering | 1. Click a node (persistent selection) 2. Hover a different node 3. Verify hover overrides visual 4. Move mouse away 5. Verify selection visual restores |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
