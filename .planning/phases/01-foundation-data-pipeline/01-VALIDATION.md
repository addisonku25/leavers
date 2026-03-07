---
phase: 1
slug: foundation-data-pipeline
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-06
validated: 2026-03-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (standard for Next.js + Vite/Turbopack projects) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DATA-01 | unit | `npx vitest run src/lib/__tests__/search-action.test.ts` | Yes | ✅ green |
| 01-01-02 | 01 | 1 | DATA-02 | unit | `npx vitest run src/lib/__tests__/fuzzy-matching.test.ts` | Yes | ✅ green |
| 01-01-03 | 01 | 1 | DATA-03 | integration | `npx vitest run src/lib/__tests__/provider.test.ts` | Yes | ✅ green |
| 01-01-04 | 01 | 1 | DATA-04 | unit | `npx vitest run src/lib/__tests__/cache-manager.test.ts` | Yes | ✅ green |
| 01-01-05 | 01 | 1 | DATA-05 | unit | `npx vitest run src/lib/__tests__/provider-factory.test.ts` | Yes | ✅ green |
| 01-02-01 | 02 | 1 | SRCH-01 | unit | `npx vitest run src/components/__tests__/search-form.test.tsx` | Yes | ✅ green |
| 01-02-02 | 02 | 1 | SRCH-04 | unit | `npx vitest run src/components/__tests__/search-progress.test.tsx` | Yes | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — Vitest configuration with React/JSX support
- [x] `src/lib/__tests__/search-action.test.ts` — 6 tests for DATA-01
- [x] `src/lib/__tests__/fuzzy-matching.test.ts` — 7 tests for DATA-02
- [x] `src/lib/__tests__/provider.test.ts` — 6 tests for DATA-03, DATA-05
- [x] `src/lib/__tests__/cache-manager.test.ts` — 6 tests for DATA-04
- [x] `src/components/__tests__/search-form.test.tsx` — 3 tests for SRCH-01
- [x] `src/components/__tests__/search-progress.test.tsx` — 3 tests for SRCH-04
- [x] Framework install: vitest, @vitejs/plugin-react, jsdom, @testing-library/react, @testing-library/jest-dom

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Loading/progress indicator displays during API fetch | SRCH-04 | Visual timing behavior hard to test deterministically | 1. Submit search with uncached company+role 2. Verify steps appear and check off 3. Verify "Taking longer than usual" shows after 15s |
| ScrapIn API validation | DATA-03 | Requires live API credentials and real data | 1. Run validation script with ScrapIn trial 2. Verify "past company" search works 3. Document results |

---

## Validation Audit 2026-03-06

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 7 requirements have automated test coverage. 36 tests pass in 1.3s.

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-03-06
