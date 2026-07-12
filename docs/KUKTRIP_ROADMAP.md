# KukTrip Product Roadmap

## Mandatory platform constraint

All KukTrip work must comply with root `KUKLABS_IDENTITY.md` and `CLAUDE.md`.
KukTrip will not ship with standalone TREK authentication, user/session storage, production database, Google Cloud project, or Firebase project.

## Phase 0 — Platform compliance audit

- Inventory imported TREK auth, sessions, users, OAuth, database, uploads, WebSocket identity and deployment assumptions.
- Map the Kuklabs AuthKit endpoint contract from `kukbook-erp/client/src/authkit/README.md`.
- Define compatibility adapters so current travel functionality can be preserved during migration.
- Decide shared Kuklabs MySQL table prefixes and ownership fields (`userId`, optional `companyId`).
- Fix production host as `trip.kuklabs.com` unless owner selects another Kuklabs subdomain.
- Register the existing Kuklabs Google OAuth client callback/origin entries; do not create a new web client.
- Reserve native package ID `com.kuklabs.kuktrip` in the existing Google Cloud/Firebase project.

## Phase 1 — Safe user-facing rebrand

- Change browser/PWA identity from TREK to KukTrip by Kuklabs.
- Replace visible logos, app names, metadata and install surfaces.
- Preserve AGPL notices and imported-history attribution.
- Avoid broad internal package renaming until build and regression tests are available.

## Phase 2 — One Kuklabs Account migration

- Replace standalone login/signup screens with Kuklabs AuthKit or `kuklabs.com/login?returnTo=...`.
- Consume shared Kuklabs identity and `.kuklabs.com` SSO session.
- Remove or disable independent user creation, passwords, OTP, Google OAuth and sessions.
- Map imported travel ownership to the shared Kuklabs `userId`.
- Add company scope only where business/group travel requires `companyId`.

## Phase 3 — Shared database migration

- Create KukTrip-prefixed tables in the existing Kuklabs MySQL database.
- Port trips, itinerary, reservations, participants, budgets, expenses, packing, documents, polls, chat and journal data.
- Replace standalone production database assumptions with the shared platform data layer.
- Add migration verification, rollback and tenant-boundary tests.

## Phase 4 — AI-first travel product

- Natural-language AI Trip Builder.
- KukTrip Copilot for itinerary creation, modification and replanning.
- Route, budget, stay, flight, local-expert and live-trip tools.
- Factual verification, source timestamping and user approval before destructive actions.

## Phase 5 — Web/PWA and native Android

- Production deployment on a Kuklabs subdomain.
- Preserve offline/PWA capabilities without caching cross-user API responses.
- Android package `com.kuklabs.kuktrip`.
- Shared Google Cloud/Firebase app registration only.
- System-browser Google OAuth with deep-link return.
- FCM through the existing Kuklabs push infrastructure.

## Phase 6 — Commercialisation

- Subscription/Trip Pass entitlements tied to the shared Kuklabs Account.
- Affiliate integrations for stays, activities, insurance, eSIM and transfers.
- Platform-wide billing and entitlement compatibility where available.

## Release gates

KukTrip cannot be marked production-ready until:

- standalone auth and user/session creation are removed or disabled;
- all production data uses the shared Kuklabs database;
- SSO works through `.kuklabs.com`;
- no separate web OAuth client, Google Cloud project or Firebase project exists;
- web and native identity flows pass cross-app account-linking tests;
- AGPL licence and notices remain compliant.
