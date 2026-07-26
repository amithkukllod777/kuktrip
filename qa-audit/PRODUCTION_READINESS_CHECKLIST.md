# Production-Readiness Checklist

Status per requirement: **PASS / FAIL / PARTIAL / NOT VERIFIED / N/A**. A green build alone is not readiness.

| # | Requirement | Status | Evidence / note |
|---|---|---|---|
| 1 | App builds & starts (client) | **PASS** | `vite build` succeeds; PWA + icons generated |
| 2 | Client test suite green | **PASS*** | 3169/3226 pass, 38 skipped; the 19 fails were the in-flight login PR's i18n parity (fixed in that PR). On `main`: green |
| 3 | Server test suite green | **NOT VERIFIED** | Not runnable here (needs DB) |
| 4 | E2E suite green | **NOT VERIFIED** | Playwright specs exist; not executed |
| 5 | No blocker/critical bugs | **PARTIAL** | None found in reviewed scope; full IDOR/security review incomplete (see `SECURITY_AUDIT.md`) |
| 6 | Auth brute-force protection | **NOT VERIFIED** | Rate limiting on login/reset/MFA not confirmed (S1) |
| 7 | CSRF / secure cookie flags | **NOT VERIFIED** | SameSite/httpOnly/secure + CSRF strategy unconfirmed (S2) |
| 8 | Per-resource authorization (IDOR) | **NOT VERIFIED** | Not exhaustively reviewed (S3) |
| 9 | Secrets secured / none in Git | **NOT VERIFIED** | Full secret scan incomplete (S5); keys encrypted at rest is a plus |
| 10 | Debug mode off in prod | **NOT VERIFIED** | Confirm no debug/swagger/verbose errors (S7) |
| 11 | Security headers / CSP (server) | **NOT VERIFIED** | Static-asset SW/CSP seen; server headers unconfirmed (S8) |
| 12 | Dependencies patched | **NOT VERIFIED** | `npm audit` not run (no network) |
| 13 | DB migrations safe/idempotent | **NOT VERIFIED** | Mechanism not fully traced |
| 14 | Backup configured | **PASS** | Cron zips DB + uploads to `data/backups/` |
| 15 | Restore tested | **FAIL** | Restore not exercised — "a backup isn't reliable until restore is tested" |
| 16 | Monitoring / crash reporting | **NOT VERIFIED** | No external monitoring integration confirmed |
| 17 | Legal pages (Terms/Privacy) | **PARTIAL** | Auth links to `kuklabs.com/terms` /`/privacy` (external) — ensure those exist |
| 18 | App version display | **PASS** | Version-available check in scheduler; version policy is Profile→About |
| 19 | Payment live config | **N/A** | No payment integration |
| 20 | Notifications delivery verified | **NOT VERIFIED** | Email/webhook/ntfy exist; no sandbox to exercise |
| 21 | Store metadata / PWA manifest correct | **PARTIAL** | Manifest present; name still "TREK" on `main` (fixed to "Kuk Trip" in the branding PR) |
| 22 | Rollback plan | **NOT VERIFIED** | Not documented in repo |
| 23 | Offline/sync correctness | **PARTIAL** | Robust design (mutation queue, idempotency, 409 conflict UI); not field-tested here |

## Release recommendation

**CONDITIONAL GO / lean NO-GO for a *public multi-tenant* launch until the auth-security gates clear.**
For a **single-user or trusted self-host** deployment the risk is materially lower. The blocking items are **#6 (auth rate-limiting), #7 (CSRF/cookie flags), #8 (IDOR review), #15 (restore test)**. None are known-broken — they are **unverified** and must be confirmed before a public launch.
