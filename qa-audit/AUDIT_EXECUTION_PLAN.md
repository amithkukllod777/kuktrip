# Audit Execution Plan — Done vs Pending

## Completed in this pass

- ✅ **Application inventory & architecture** (server integrations file-grounded; client pages enumerated) — `FEATURE_INVENTORY.md`.
- ✅ **Critical user journeys** mapped — `FEATURE_INVENTORY.md`.
- ✅ **Real test execution** (client `vitest run`, 3226 tests) with root-caused failures — `TEST_COVERAGE_MATRIX.md`.
- ✅ **Competitive audit** (selection, feature matrix, roadmap) with dated, confidence-labelled web evidence — `COMPETITOR_*` / `COMPETITIVE_*`.
- ✅ **First-pass security review** — `SECURITY_AUDIT.md` (**PARTIAL**).
- ✅ **Production-readiness checklist** & **remediation plan**.

## Interrupted by a session usage limit (resume when reset)

Two parallel passes were cut off mid-run:

1. **Deep security scan** — completed: SSRF-guard mapping, secret-scan intent, auth surface. **Pending:** exhaustive IDOR/authorization review of every `server/src/nest/*` controller, CSRF/CORS config confirmation, dependency-risk pass, debug/swagger exposure check. → finish `SECURITY_AUDIT.md`.
2. **Full route-by-route inventory** — the server endpoint list is partial. **Pending:** enumerate every Nest controller route + tRPC/REST endpoint and map role/permission per route.

## Not executable in this environment (documented, not faked)

Provide the following to complete these sections; until then they are **NOT TESTED** with the manual procedure noted:

| Area | Needs | Manual procedure |
|---|---|---|
| Performance / load | Running server + DB | k6/autocannon against key endpoints; Lighthouse on the SPA; measure cold start, screen load, API p50/p95 |
| Real-device compatibility | Device farm / BrowserStack | Matrix: iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari; low-end device; tablet |
| Full pentest | Authorized target + tooling | OWASP ASVS pass; ZAP/Burp authenticated scan; per-role IDOR probing |
| Notifications delivery | SMTP + ntfy sandbox | Trigger each channel; verify preferences, dedupe, deep links |
| Backup/restore | Staging DB | Run backup, wipe, restore, verify integrity + point-in-time |
| Payments | N/A | No payment integration exists — nothing to test |

## Suggested next phases

- **Phase 2:** finish the security IDOR/authorization matrix + full route inventory (highest risk).
- **Phase 3:** stand up an ephemeral server+SQLite in CI; run server/e2e suites; capture Lighthouse + basic load numbers.
- **Phase 4:** UI/UX competitor deep-dive with screenshots (was deprioritized vs. the code-grounded work).
