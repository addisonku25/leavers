---
phase: 3
slug: insights
status: draft
nyquist_compliant: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | INSI-01 | unit | `npx vitest run src/lib/__tests__/insights.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | INSI-02 | unit | `npx vitest run src/lib/__tests__/insights.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | INSI-03 | unit | `npx vitest run src/lib/__tests__/insights.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/insights.test.ts` — stubs for INSI-01, INSI-02, INSI-03
- No framework install needed — vitest already configured and working

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| InsightsCard renders above Sankey diagram | INSI-01/02/03 | Visual layout positioning | Load results page, verify card appears between header and Sankey |
| Pattern summary reads naturally | INSI-03 | Subjective text quality | Read generated sentences for grammar and clarity |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
