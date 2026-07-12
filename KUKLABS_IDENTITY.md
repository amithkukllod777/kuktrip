# KUKLABS_IDENTITY.md — KukTrip Integration Mandate

> Source of truth: `amithkukllod777/kukbook-erp/KUKLABS_IDENTITY.md` on `main`.
> The upstream document is authoritative. This local file makes the mandate visible to every developer and coding agent working in this repository.

## Non-negotiable rules

KukTrip is a Kuklabs product and must use the shared Kuklabs platform identity and infrastructure.

1. **One Kuklabs Account**
   - Do not create or retain a separate KukTrip login, signup, user, account, session, JWT, password, OTP, or Google OAuth system.
   - Use the Kuklabs AuthKit endpoint contract documented in `kukbook-erp/client/src/authkit/README.md`, or redirect users to `kuklabs.com/login` with `returnTo`.
   - User identity comes from the shared Kuklabs `userId`; company-owned data must also use `companyId` where applicable.
   - Same email must resolve to the same Kuklabs Account.

2. **One shared database and platform server**
   - Do not provision a separate production database for KukTrip.
   - KukTrip data must live in the existing shared MySQL database using KukTrip-prefixed, user/company-scoped tables and the migration rules from `kukbook-erp`.
   - Do not introduce an independent production backend exception without explicit owner approval.

3. **One Google Cloud and Firebase project**
   - Do not create a separate Google Cloud or Firebase project.
   - Web OAuth uses the existing Kuklabs OAuth client and adds only the KukTrip subdomain origin and callback URI.
   - Native package ID: `com.kuklabs.kuktrip`.
   - Native Google sign-in must use system-browser OAuth with deep-link return, not an embedded webview.
   - Firebase remains limited to the approved shared uses such as phone verification and FCM; it is not the primary user database.

4. **Hosting and SSO**
   - Production web app must use a `*.kuklabs.com` subdomain so the shared `.kuklabs.com` session cookie works.
   - Recommended hostname: `trip.kuklabs.com`.

## KukTrip migration consequence

The imported TREK code contains its own authentication, session, user storage, server, and database assumptions. Those parts are **not acceptable as KukTrip production architecture**. They may remain temporarily only as imported reference code while the product is migrated.

Before production release, KukTrip must:

- replace TREK auth screens and flows with Kuklabs AuthKit/SSO;
- remove or disable independent user/session creation;
- map all ownership to the shared Kuklabs `userId` and optional `companyId`;
- move KukTrip persistence into the shared Kuklabs MySQL database;
- use existing Kuklabs Google Cloud/Firebase configuration;
- document every temporary compatibility adapter and its removal milestone.

## PR rejection conditions

Reject any change that introduces:

- a new users/accounts/sessions table;
- a separate production database or Firebase project;
- app-specific password or OTP storage;
- a new Google OAuth client/secret for web;
- a host-only session cookie;
- Firebase as the primary identity database;
- an embedded-webview Google sign-in flow.
