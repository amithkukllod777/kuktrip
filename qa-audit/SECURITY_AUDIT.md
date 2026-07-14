# Security Audit — FIRST PASS (PARTIAL)

> ⚠️ **Incomplete.** The deep security pass was interrupted by a session usage limit. This documents **confirmed positive controls** and **suspected gaps to verify** — it is NOT a full pentest or a complete IDOR/authorization review. No exploitation was performed; no secret values are printed. See `AUDIT_EXECUTION_PLAN.md` for what remains.

## Confirmed positive controls (CONFIRMED — code-grounded)

| Control | Evidence | Why it matters |
|---|---|---|
| **SSRF guards on all server-side fetches** | `safeFetch`/`safeFetchLlm`/pinned dispatcher used in `services/mapsService.ts`, `services/notifications.ts` (webhook/ntfy), `services/unsplashService.ts`, `airtrail/airtrailClient.ts`; LLM allows localhost/LAN but **blocks cloud metadata range** | The app makes many user-influenced outbound calls (maps, webhooks, photo providers, AirTrail); guards mitigate SSRF to internal/metadata endpoints |
| **Secrets encrypted at rest** | Per-user `maps_api_key`, `unsplash_api_key`, Immich/Synology creds, `llm_*` keys stored encrypted; masked to client | Limits blast radius of DB exposure |
| **Hardened file upload** | `files.controller.ts`: multer `diskStorage`, **UUID filenames**, extension allowlist, **blocked SVG/blocked extensions**, size caps (`MAX_FILE_SIZE`/`MAX_VIDEO_SIZE`) | Mitigates unrestricted upload, stored-XSS via SVG, and path traversal (server-generated names) |
| **Open-redirect guard on login** | `useLogin.ts` `redirectTarget` only accepts relative paths starting `/` and rejects `//` and `/\` | Prevents post-login open redirect |
| **Service worker never caches `/api/*`** | `vite.config.js` runtime caching = `NetworkOnly` for API with denylist | Prevents **cross-user data leak** from a shared-device SW cache |
| **Inline-HTML sanitization in i18n** | `tHtml` → `sanitizeInlineHtml`/`escapeHtml` (`i18n/TranslationContext.tsx`) | Reduces translation-injected XSS |
| **Idempotency keys w/ TTL for offline replay** | `X-Idempotency-Key`, 30-day TTL (`scheduler.ts`) | Prevents duplicate writes on multi-day offline replay |
| **Rate limiting present on some surfaces** | Transit (JWT + rate-limit), MCP (`MCP_RATE_LIMIT`, per-user session caps), plugin host (per-plugin rate/daily budget) | Baseline abuse protection on those routes |
| **Strong auth options** | Passkeys/WebAuthn, TOTP MFA step-up, OIDC with `invalid_state` handling, must-change-password | Good account-security posture |
| **Secure-cookie awareness** | App detects a `Secure` cookie dropped over plain HTTP and surfaces guidance (`insecureCookie`); `COOKIE_SECURE` env | Avoids silent auth failure; encourages HTTPS |
| **Sandboxed plugin egress** | `runtime/egress-policy.ts`, `TREK_PLUGIN_ALLOW_PRIVATE_EGRESS` default-deny private ranges | Contains third-party plugin risk |

## Suspected gaps — VERIFY (SUSPECTED, not confirmed)

| # | Area | Suspected issue | Exact check | Severity if confirmed |
|---|---|---|---|---|
| S1 | **Auth brute-force** | Rate limiting on **login / password-reset / MFA / OTP** endpoints not confirmed | Inspect the auth controllers/guards for a throttler (e.g. Nest `@Throttle`/express-rate-limit) on `/api/auth/login`, `/reset`, MFA verify | Major |
| S2 | **CSRF** | Cookie-based auth + state-changing endpoints — CSRF defense (SameSite=strict/lax or token) not confirmed | Check session cookie `sameSite`/`httpOnly`/`secure` flags in the server auth module; confirm CSRF strategy for non-idempotent routes | Major |
| S3 | **Per-resource authorization (IDOR)** | Not exhaustively reviewed; trips/files/collab/memories must authorize the current user for the target id | Route-by-route review of `server/src/nest/*` controllers for ownership/membership checks (esp. file download, photo stream, reservation import, collab) | Critical if missing |
| S4 | **Password-reset link in logs** | When SMTP is unset, the reset link is written to server stdout (`notifications.ts`) | Acceptable for self-host but document; ensure not enabled with shared log access | Minor |
| S5 | **Secrets committed to Git** | Full secret scan did not complete | `git log`/tree scan for `.env`, keys, tokens; verify Dockerfile has no baked secrets | Critical if present |
| S6 | **Dependency vulnerabilities** | Not audited (no network) | `npm audit --production` in a networked env; review pinned versions | Varies |
| S7 | **Debug/OpenAPI/GraphQL exposure** | Not confirmed disabled in prod | Check for swagger/debug routes, source maps, verbose errors in production build | Minor–Major |
| S8 | **Security headers / CSP (server responses)** | SW/CSP for static assets seen; server response headers (helmet, CSP, HSTS) not confirmed | Inspect server bootstrap for `helmet`/CSP/HSTS | Minor–Major |

## Not done (would complete the audit)

- Full authenticated IDOR probing per role (S3) — the single highest-value remaining item.
- Complete secret scan (S5), dependency audit (S6), header/CSP confirmation (S8).
- OWASP ASVS mapping.

**Bottom line:** the positive controls observed are **above average for a self-hosted OSS app** (SSRF guards, encrypted keys, hardened uploads, SW cross-user-leak avoidance). The **open questions that gate a production sign-off** are auth rate-limiting (S1), CSRF/cookie flags (S2), and a complete IDOR review (S3).
