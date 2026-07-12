# KukTrip Development Rules

## Mandatory Kuklabs platform contract

Read `KUKLABS_IDENTITY.md` before making architectural or authentication changes.
The authoritative source is `amithkukllod777/kukbook-erp/KUKLABS_IDENTITY.md` on `main`.

KukTrip must use:

- One Kuklabs Account through the shared AuthKit endpoint contract;
- the shared Kuklabs MySQL database and platform server;
- the existing Kuklabs Google Cloud and Firebase project;
- `.kuklabs.com` SSO cookies and a Kuklabs subdomain;
- `com.kuklabs.kuktrip` for the native application package.

Never add a separate login/signup system, users table, session/JWT system, production DB, Google OAuth web client, Firebase project, OTP implementation, or primary Firebase identity store.

## Imported TREK architecture

This repository was imported from TREK. Existing TREK authentication, storage and server assumptions are legacy migration targets, not approved KukTrip production architecture. Preserve functionality during migration, but do not deepen dependency on standalone auth or database components.

## Required implementation order

1. Inventory current auth, user, session, database and OAuth dependencies.
2. Define a compatibility boundary around the Kuklabs AuthKit contract.
3. Replace user identity with shared Kuklabs `userId` and optional `companyId`.
4. Move persistence to KukTrip-prefixed tables in the shared database.
5. Remove or disable legacy standalone identity flows.
6. Add web SSO and native browser-OAuth/deep-link validation.
7. Only then proceed with production deployment and Android release.

Every PR touching identity, auth, DB, cloud configuration, mobile package IDs or deployment must explicitly state how it complies with `KUKLABS_IDENTITY.md`.
