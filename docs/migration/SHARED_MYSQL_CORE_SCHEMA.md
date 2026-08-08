# KukTrip Shared MySQL Core Schema

Status: additive target-schema definition for issue #18. **Not a runtime cutover.**

## Platform contract used

This schema follows the canonical Kuklabs database contract from `kukbook-erp`:

- one shared MySQL database (`DATABASE_URL`)
- authoritative identity is the shared `users` table
- `users.id` is the authoritative integer user ID
- `users.openId` is the unique Kuklabs Account identity
- product migrations are additive/idempotent
- KukTrip does not create a second `users`, password, OTP or session table

The migration refuses to run when the target database does not expose `users(id, openId)`. This prevents accidentally creating KukTrip tables in an unrelated database.

## Personal vs company trips

KukTrip is both a consumer and ecosystem product. A user can legitimately plan a personal trip without owning or selecting a Kuklabs company.

Therefore `kuktrip_trips` carries both:

- `kt_ownerUserId INT NOT NULL` — always authoritative, points logically to shared `users.id`
- `kt_companyId INT NULL` — optional tenant scope for company-managed/business trips

Rules for the future runtime adapter:

1. Personal trip: `companyId = NULL`; authorize by owner/membership using server-authenticated `userId`.
2. Company trip: server resolves `companyId` from authenticated Kuklabs context/membership; never trust a client-supplied company ID.
3. Product child tables inherit scope through `tripId`; they do not accept arbitrary company scope from clients.
4. User IDs always come from AuthKit/platform identity, never from request bodies.

## Table namespace

Product tables are prefixed `kuktrip_` and columns use short product prefixes:

- `kuktrip_trips` (`kt_`)
- `kuktrip_trip_members` (`ktm_`)
- `kuktrip_days` (`kd_`)
- `kuktrip_day_notes` (`kdn_`)
- `kuktrip_places` (`kp_`)
- `kuktrip_day_assignments` (`ka_`)
- `kuktrip_reservations` (`kr_`)
- `kuktrip_reservation_endpoints` (`kre_`)
- `kuktrip_identity_migration_map` (`kim_`) — temporary migration bridge only

The schema deliberately does not recreate TREK local authentication tables.

## Identity migration

Current SQLite compatibility rows store Kuklabs `openId` in `users.oidc_sub` with `oidc_issuer='kuklabs'`.

Before copying product rows, migration tooling must resolve:

`SQLite local user id -> openId -> shared MySQL users.id`

and record the verified mapping in `kuktrip_identity_migration_map`.

A product row with an unmapped owner/member must be rejected from production cutover evidence rather than assigned to a guessed user.

## Why no FK from owner/member to shared `users`

KukTrip stores/indexes shared user IDs but the first additive schema does not attach cross-product foreign keys to the platform `users` table. User deletion and ecosystem lifecycle are platform concerns; coupling a new product migration to destructive/cascade behavior on the shared identity table would be unsafe before that lifecycle is explicitly implemented.

KukTrip-owned parent/child relations do use foreign keys and cascades.

## Migration execution

Schema file:

`server/scripts/shared-mysql-core.cjs`

It follows the KukBook migration convention (`mysql2/promise`, `DATABASE_URL`, `CREATE TABLE IF NOT EXISTS`). It is intentionally **not wired into deploy/start scripts in this PR** and is not executed automatically.

The runtime/driver dependency and lockfile will be introduced with the MySQL adapter PR, not hidden inside a schema-definition PR. Production execution requires:

1. backup/snapshot confirmation;
2. disposable/staging `DATABASE_URL` dry run;
3. identity mapping coverage;
4. source/target row-count evidence;
5. adapter tests;
6. explicit production cutover approval.

## Next adapter order

1. trips + membership
2. days + day notes
3. places + assignments
4. reservations + endpoints
5. budgets/costs
6. packing/todos
7. files/photos/journey
8. collaboration/polls/notifications
9. Explore/social tables directly on shared MySQL

SQLite remains authoritative until a separate controlled cutover PR changes runtime configuration.
