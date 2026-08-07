# KukTrip ⇄ Kuklabs Platform Integration Contract (Phase 4)

Every dependency KukTrip has on the shared Kuklabs platform, and the exact contract it rides on.
**No direct, undocumented dependency is acceptable.** KukTrip is a separate repo/app but is bound by
the repo-agnostic identity + infra mandate in [`KUKLABS_IDENTITY.md`](../../KUKLABS_IDENTITY.md):
one Kuklabs Account, one MySQL DB, one Google/Firebase project, shared platform services.

## 1. Identity — One Kuklabs Account (SSO)
- **Contract:** the platform sets a session cookie (`app_session_id`) scoped to the registrable
  domain `.kuklabs.com`. A signed HS256 JWT with payload `{ openId, appId, name, iat, exp }`.
- **KukTrip consumption (implemented):**
  - **Silent bridge** — `server/src/middleware/kuklabsSso.ts` reads the `.kuklabs.com` cookie,
    verifies it with the **shared** `KUKLABS_JWT_SECRET` (= platform `JWT_SECRET`), and
    find-or-provisions a local user keyed by the KukLabs `openId` (stored in the existing
    `users.oidc_sub` with `oidc_issuer='kuklabs'` — **no separate users table**). Fails open.
  - **Login** — when SSO is enabled the login page is **Kuklabs-only**: sign-in AND sign-up both
    redirect to the shared `/login` (email+password, mobile+email OTP, Google). KukTrip builds **no**
    login/OTP/password system of its own.
- **Config:** `KUKLABS_SSO_ENABLED`, `KUKLABS_JWT_SECRET`, `KUKLABS_COOKIE_NAME`,
  `KUKLABS_LOGIN_URL`, `KUKLABS_ADMIN_OPENIDS` (see `server/.env.example`). OFF by default so the
  open-source TREK build is unaffected.
- **Return path:** the shared `/login` accepts a `returnTo` back to `*.kuklabs.com`
  (kukbook-erp PR #1026) so login returns seamlessly to `trip.kuklabs.com`.

## 2. Shared user identity / `userId`
- One `openId` per Kuklabs Account across all apps. KukTrip maps it to a local row; the KukLabs
  identity is authoritative. KukTrip stores its data against that user. **Never** a second identity.

## 3. AuthKit / REST contract
- Web apps in the monorepo use `<KuklabsAuthCard/>` / `useAuthMachine()`; a separate-repo app like
  KukTrip uses the **endpoint contract** (`client/src/authkit/README.md`): redirect to
  `kuklabs.com/login`, and Google via the system browser at
  `https://kuklabs.com/api/auth/google/start`. Calling `trpc.auth.*` directly is forbidden.

## 4. Shared MySQL database
- Single ecosystem DB (`DATABASE_URL`). KukTrip's tenant-scoped tables live in the shared DB per the
  platform migration policy. KukTrip **owns its migration definitions** but they execute against the
  shared DB — never a separate database or schema copy.

## 5. Billing / product membership / entitlements
- Owned by the platform. KukTrip **reads** membership/entitlement; it does not implement billing,
  plans, or subscriptions locally (Trip Pass, when built, plugs into platform billing).

## 6. Notifications
- Delivery (FCM push, email transport) is a **shared platform service**; KukTrip owns only its
  **notification templates/content**. Native push uses the shared Firebase project (below).

## 7. File storage
- If shared object storage is used, KukTrip consumes the platform storage contract. (The current
  TREK-derived build uses local/S3-compatible storage per its own config; unify to the platform
  storage service when consolidating.)

## 8. AI / platform services
- Shared AI shell / `invokeLLM` is a platform capability. KukTrip's AI Trip Builder / Copilot call
  the platform AI service; they do not embed separate model credentials.

## 9. Google Cloud / Firebase
- **One** Google Cloud project (OAuth client) and **one** Firebase project (`google-services.json`
  lives in the platform repo) for the whole ecosystem. KukTrip native (`com.kuklabs.kuktrip`, app id
  `com.kuklabs.trip`) registers under the **same** projects — never a new project or Google identity.

## 10. Legal / privacy / telemetry
- Terms, Privacy, and shared analytics are platform surfaces on `kuklabs.com`. KukTrip links to them.

## 11. Product registry / discovery
- KukTrip is registered in `shared/products/registry.ts`
  (`kuktrip → subdomain "trip", dependsOn ["platform-core"], status "live"`) and listed in
  `shared/superAdminApps.ts`. These stay in the platform repo; KukTrip does not duplicate them.

---
### Hard "never" list (identity mandate)
Separate users table · separate auth backend · separate password/OTP system · separate Firebase
project · separate Google identity · separate DB/schema copy. Any of these = contract violation.
