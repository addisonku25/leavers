---
phase: 2
slug: results-visualization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | SRCH-02, SRCH-03, SRCH-06, PRIV-01 | unit | `npx vitest run src/lib/__tests__/sankey-data.test.ts` | Created in Plan 01 Task 2 | ⬜ pending |
| 02-01-02 | 01 | 1 | — | unit | `npx vitest run src/lib/__tests__/seniority.test.ts` | Created in Plan 01 Task 1 | ⬜ pending |
| 02-02-01 | 02 | 2 | SRCH-05 | component | `npx vitest run src/components/__tests__/empty-state.test.tsx` | Created in Plan 02 Task 1 | ⬜ pending |
| 02-03-01 | 03 | 3 | SRCH-06 | component | `npx vitest run src/components/__tests__/sankey-diagram.test.tsx` | Created in Plan 03 Task 1 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test files are created inline within their respective plan tasks. No separate Wave 0 scaffold needed:

- [x] `src/lib/__tests__/sankey-data.test.ts` — created in Plan 01 Task 2 (TDD)
- [x] `src/lib/__tests__/seniority.test.ts` — created in Plan 01 Task 1 (TDD)
- [x] `src/components/__tests__/empty-state.test.tsx` — created in Plan 02 Task 1
- [x] `src/components/__tests__/sankey-diagram.test.tsx` — created in Plan 03 Task 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sankey hover highlights connected paths | SRCH-06 | Requires visual inspection of SVG hover interactivity | Hover over links/nodes, verify opacity changes and tooltip appears |
| Responsive grid reflows at breakpoints | SRCH-02 | CSS breakpoint behavior | Resize browser, verify 2-3 column reflow |
| Empty state visual polish | SRCH-05 | Aesthetic judgment | Navigate to results with no data, verify illustration/CTA |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or test files created in-plan
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
