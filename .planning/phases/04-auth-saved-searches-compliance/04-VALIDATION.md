---
phase: 4
slug: auth-saved-searches-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
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
| 04-01-01 | 01 | 1 | AUTH-01 | unit | `npx vitest run src/lib/__tests__/auth.test.ts -t "signup"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | AUTH-02 | manual | Manual -- requires browser session verification | N/A | ⬜ pending |
| 04-01-03 | 01 | 1 | AUTH-03 | unit | `npx vitest run src/lib/__tests__/auth.test.ts -t "signout"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | SAVE-01 | unit | `npx vitest run src/actions/__tests__/saved-searches.test.ts -t "save"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | SAVE-02 | unit | `npx vitest run src/actions/__tests__/saved-searches.test.ts -t "list"` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | SAVE-03 | unit | `npx vitest run src/actions/__tests__/saved-searches.test.ts -t "delete"` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | PRIV-02 | unit | `npx vitest run src/lib/__tests__/rate-limit.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | PRIV-03 | unit | `npx vitest run src/app/__tests__/legal-pages.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/auth.test.ts` — stubs for AUTH-01, AUTH-03 (mock Better Auth)
- [ ] `src/actions/__tests__/saved-searches.test.ts` — stubs for SAVE-01, SAVE-02, SAVE-03
- [ ] `src/lib/__tests__/rate-limit.test.ts` — stubs for PRIV-02
- [ ] `src/app/__tests__/legal-pages.test.tsx` — stubs for PRIV-03 (renders without error)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across browser sessions | AUTH-02 | Requires real browser cookie persistence | 1. Sign up, 2. Close browser tab, 3. Reopen app, 4. Verify still logged in |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
