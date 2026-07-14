# Bug Report

Confirmed, reproduced defects use the full template. Suspected-but-unconfirmed security items are tracked separately in `SECURITY_AUDIT.md` (S1–S8) to avoid reporting unverified issues as bugs.

---

## BUG-001 — i18n key parity broke (English-only keys)

- **Module:** i18n / localization
- **Environment:** client test suite (`vitest`), any locale ≠ en
- **Preconditions:** the in-flight branding/login PR added 10 new `login.*` keys to `shared/src/i18n/en/login.ts` only
- **Steps to reproduce:**
  1. Add a key to `en/login.ts` without adding it to other locales.
  2. Run `npx vitest run tests/unit/i18n/parity.test.ts`.
- **Expected:** all locales share the same key set; test passes.
- **Actual:** **19 failures** — each non-en locale reported the 10 keys as `missing`.
- **Severity:** Minor (build/test gate; runtime unaffected because `strings[key] ?? en[key] ?? key` falls back to English)
- **Priority:** High (blocks CI green on the branding PR)
- **Evidence:** `client/tests/unit/i18n/parity.test.ts:60`; full run showed `19 failed / 3169 passed / 38 skipped`.
- **Root cause:** localization parity invariant not maintained when adding keys.
- **Fix:** add the 10 keys to all 21 non-en locale `login.ts` files (English placeholders until translated). **Status: FIXED** on the branding PR branch; parity suite green (20/20).
- **Regression risk:** Low — additive keys only; runtime already fell back to English.

---

## Candidate issues NOT filed as bugs (unverified)

The following were **not reproduced/confirmed** in this pass and are tracked as SUSPECTED in `SECURITY_AUDIT.md` with the exact verification step. Do not treat them as confirmed defects:

- S1 auth rate-limiting, S2 CSRF/cookie flags, S3 per-resource IDOR authorization, S5 secrets-in-Git, S6 dependency vulns, S7 debug/swagger exposure, S8 server security headers.

No other confirmed functional/crash/data-loss defects were found within the reviewed scope (auth flows, i18n, client build/tests). Server-side runtime behaviour was **NOT TESTED** (no DB) — absence of bugs there is not asserted.
