# Remediation Plan

Ordered by risk. Complexity: S/M/L/XL. "Owner type" = who typically does it.

## Immediate — before a public/multi-tenant release

| Action | Why | Owner | Complexity | Verify |
|---|---|---|---|---|
| Confirm & add **rate limiting** on `/api/auth/login`, password-reset, MFA/OTP verify (S1) | Brute-force / credential-stuffing | Backend | S–M | Hit endpoint N times → throttled/429 |
| Confirm **session cookie flags** (httpOnly, secure, SameSite) + **CSRF** strategy for state-changing routes (S2) | Session theft / CSRF | Backend | S–M | Inspect Set-Cookie; attempt cross-site POST |
| **IDOR / authorization review** of every `server/src/nest/*` controller — esp. file download, photo stream, reservation import, collab, memories (S3) | Cross-tenant data access | Backend/Security | M–L | Per-role attempt to read another user's trip/file id → 403 |
| Complete **secret scan** of repo + Docker (S5) | Leaked credentials | Security | S | Tree/log scan clean; rotate anything found |
| **Test backup restore** end-to-end (readiness #15) | Unverified backups = no DR | DevOps | S | Backup → wipe → restore → integrity check |

## Short term — next sprint

| Action | Why | Complexity |
|---|---|---|
| Run `npm audit` + patch high/critical deps (S6) | Vuln management | S |
| Confirm **debug/swagger off** + no source maps + safe error messages in prod (S7) | Info leakage | S |
| Add **server security headers** (helmet/CSP/HSTS) if absent (S8) | Hardening | S |
| Make **server + shared + e2e suites runnable in CI** with ephemeral SQLite | Full-stack signal per PR | M |
| Ensure **demo mode cannot be on in production** config | Accidental data reset/exposure | S |
| Verify external **legal pages** (Terms/Privacy) exist for the launch domain | Compliance/store | S |

## Medium term

| Action | Why | Complexity |
|---|---|---|
| Basic **performance baseline** (Lighthouse + p50/p95 on key APIs, cold start) | Perf regressions | M |
| **Real-device compatibility** matrix (iOS Safari, Android Chrome, tablets, low-end) | Field bugs | M |
| **Notifications** end-to-end verification incl. dedupe/preferences/deep-links | Delivery correctness | M |
| Document a **rollback plan** | Safe releases | S |
| Coverage for **account deletion / data export** + **offline 409 conflict** paths | Data-integrity + privacy compliance | M |

## Long term / technical debt

| Action | Why | Complexity |
|---|---|---|
| **Native mobile or first-class PWA packaging** (P0 competitive) | Biggest market gap | L–XL |
| **Reservation email-intake** path + parse-quality parity (P0 competitive) | Table-stakes | L |
| **Flight tracking + push (add Web-Push/VAPID) + calendar sync (ICS)** (P1) | Table-stakes | M–L |
| Continue **TREK → Kuk Trip** rebrand cleanup beyond auth (strings, wiki links, `mauriceboe/TREK` references) | Brand consistency | S–M |

> This plan separates **confirmed** work (build/test/backup/rebrand) from **verify-then-fix** items (the S1–S8 security questions). Do not treat the "NOT VERIFIED" items as either safe or broken until checked.
