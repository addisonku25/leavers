---
phase: 2
slug: results-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 02-01-01 | 01 | 0 | SRCH-02, SRCH-03, SRCH-06, PRIV-01 | unit | `npx vitest run src/lib/__tests__/sankey-data.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | SRCH-05 | unit | `npx vitest run src/components/__tests__/empty-state.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | SRCH-06 | unit | `npx vitest run src/components/__tests__/sankey-diagram.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 0 | — | unit | `npx vitest run src/lib/__tests__/seniority.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/sankey-data.test.ts` — stubs for SRCH-02, SRCH-03, SRCH-06, PRIV-01
- [ ] `src/lib/__tests__/seniority.test.ts` — seniority level parsing tests
- [ ] `src/components/__tests__/empty-state.test.tsx` — stubs for SRCH-05
- [ ] `src/components/__tests__/sankey-diagram.test.tsx` — stubs for SRCH-06

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sankey hover highlights connected paths | SRCH-06 | Requires visual inspection of SVG hover interactivity | Hover over links/nodes, verify opacity changes and tooltip appears |
| Responsive grid reflows at breakpoints | SRCH-02 | CSS breakpoint behavior | Resize browser, verify 2-3 column reflow |
| Empty state visual polish | SRCH-05 | Aesthetic judgment | Navigate to results with no data, verify illustration/CTA |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
