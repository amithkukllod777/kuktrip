# Test Coverage Matrix & Real Run Results

## Executed run (real, not fabricated)

**Command:** `npx vitest run` (client workspace) · **Date:** 2026-07-14.

| Metric | Result |
|---|---|
| Test files | **190** (189 passed, 1 failed) |
| Tests | **3226** total — **3169 passed**, **19 failed**, **38 skipped** |
| Duration | ~252 s |

### The 19 failures — root-caused (and fixed)

All 19 failures were in **`client/tests/unit/i18n/parity.test.ts`** (one per non-English locale). Root cause: the in-flight **branding/login PR** added 10 new `login.*` keys to English only, breaking the locale key-parity invariant.

- **Status: FIXED** on the login PR branch (the 10 keys were added to all 21 non-en locales; the parity suite is green there). On this audit branch (`main`, which predates those keys) the parity test **PASSES**.
- **Lesson / guardrail:** the parity test is doing its job — any i18n key addition must land in **all** locales. Confirmed as a real quality gate, not a flaky test.

### Not executed here (and why)

| Suite | Status | Reason |
|---|---|---|
| Server tests (`server/`) | NOT TESTED | Needs a DB/env; no DB provisioned in this container |
| Shared tests (`shared/`) | NOT TESTED (run separately) | Not run in this pass; `shared` builds cleanly (used by client tests) |
| E2E (`client/e2e/`, Playwright) | NOT TESTED | Needs a running app + browser session against a live server |

## Coverage assessment (client)

| Area | Automated coverage | Notes |
|---|---|---|
| Auth (login/register/MFA/oidc/passkey/demo/reset) | **Strong** | `LoginPage.test.tsx` (+ oidc-redirect) exercises all branches (27 tests) |
| i18n parity | **Strong** | Enforced across 22 locales |
| Components (Budget, Files, Settings, Collab, Trips, Packing, Admin, Notifications…) | **Broad** | Many `*.test.tsx` present |
| Server API contracts | **Unknown here** | Server suite not run; verify separately |
| E2E critical journeys | **Present but unverified** | Playwright specs exist; not executed |

## Gaps / recommendations

- Wire **server** + **shared** + **Playwright e2e** suites into a runnable CI job with an ephemeral SQLite DB so a full-stack green/red is visible per PR (they exist but weren't runnable in this environment).
- Add coverage for **account deletion / data export** and **offline sync conflict resolution (409 keep-mine/keep-theirs)** if not already covered — high-risk data-integrity paths.
- Treat i18n key additions as a checklist item (parity gate already enforces it).

*Every row above is labelled from the actual run; nothing is marked PASS that was not executed.*
