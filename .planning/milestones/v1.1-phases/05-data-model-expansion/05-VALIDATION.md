---
phase: 5
slug: data-model-expansion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/__tests__/schema-leavers.test.ts src/lib/__tests__/provider.test.ts -x` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/__tests__/schema-leavers.test.ts src/lib/__tests__/provider.test.ts -x`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DMOD-01 | unit | `npx vitest run src/lib/__tests__/schema-leavers.test.ts -x` | No -- Wave 0 | pending |
| 05-01-02 | 01 | 1 | DMOD-02 | unit | `npx vitest run src/lib/__tests__/schema-leavers.test.ts -x` | No -- Wave 0 | pending |
| 05-02-01 | 02 | 1 | DMOD-03 | unit | `npx vitest run src/lib/__tests__/provider.test.ts -x` | Exists (extend) | pending |
| 05-02-02 | 02 | 1 | DMOD-04 | unit | `npx vitest run src/lib/__tests__/provider.test.ts -x` | Exists (extend) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/schema-leavers.test.ts` — stubs for DMOD-01, DMOD-02 (schema structure validation)
- [ ] Extend `src/lib/__tests__/provider.test.ts` — stubs for DMOD-03, DMOD-04 (searchDetailed on mock)

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
