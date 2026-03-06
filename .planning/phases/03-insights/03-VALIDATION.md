---
phase: 3
slug: insights
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 03-01-T1 | 01 | 1 | INSI-01 | unit (TDD) | `npx vitest run src/lib/__tests__/insights.test.ts` | pending |
| 03-01-T2 | 01 | 1 | INSI-02 | unit (TDD) | `npx vitest run src/lib/__tests__/insights.test.ts` | pending |
| 03-01-T3 | 01 | 1 | INSI-03 | unit (TDD) | `npx vitest run src/lib/__tests__/insights.test.ts` | pending |
| 03-02-T1 | 02 | 2 | INSI-01/02/03 | typecheck | `npx tsc --noEmit` | pending |
| 03-02-T2 | 02 | 2 | INSI-01/02/03 | typecheck + test | `npx tsc --noEmit && npm test` | pending |
| 03-02-T3 | 02 | 2 | INSI-01/02/03 | manual | Visual verification | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- No separate Wave 0 needed -- Plan 01 uses TDD (tests created as part of each task's RED phase)
- vitest already configured and working

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| InsightsCard renders above Sankey diagram | INSI-01/02/03 | Visual layout positioning | Load results page, verify card appears between header and Sankey |
| Pattern summary reads naturally | INSI-03 | Subjective text quality | Read generated sentences for grammar and clarity |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify elements
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 not needed (TDD tasks create their own tests)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
