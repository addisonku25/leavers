---
phase: 8
slug: polish-bidirectional-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library (jsdom) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | SANK-05 | unit | `npx vitest run src/components/results/__tests__/drill-down-provider.test.tsx` | ✅ (extend) | ⬜ pending |
| 08-01-02 | 01 | 1 | SANK-05 | unit | `npx vitest run src/components/results/__tests__/drill-down-provider.test.tsx` | ✅ (extend) | ⬜ pending |
| 08-01-03 | 01 | 1 | SANK-05 | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | ✅ (extend) | ⬜ pending |
| 08-01-04 | 01 | 1 | SANK-05 | unit | `npx vitest run src/components/results/__tests__/company-grid.test.tsx` | ✅ (extend) | ⬜ pending |
| 08-01-05 | 01 | 1 | SANK-05 | manual | Visual verification in browser | N/A | ⬜ pending |
| 08-01-06 | 01 | 1 | SANK-05 | manual | Visual verification in browser | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The `drill-down-provider.test.tsx` and `company-grid.test.tsx` files exist and will be extended with new test cases for optional `nodeIndex` behavior.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Card click highlights Sankey node | SANK-05 | Visual rendering requires browser | Click company name in card, verify corresponding Sankey node gets stroke highlight |
| Animation polish feels cohesive | SANK-05 | Subjective visual quality | Click through all interactions (card→Sankey, Sankey→card, toggle, switch), verify smooth transitions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
