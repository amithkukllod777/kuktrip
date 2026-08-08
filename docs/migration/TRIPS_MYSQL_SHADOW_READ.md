# KukTrip Trips — Shared MySQL Shadow Read

This stage verifies the first production read domain without changing what users receive.

## Runtime modes

- `KUKTRIP_PERSISTENCE_MODE=sqlite` — current default. No MySQL connection.
- `KUKTRIP_PERSISTENCE_MODE=mysql-shadow` — API responses still come from SQLite; Trips list/detail are also read from shared MySQL asynchronously and compared.
- `KUKTRIP_PERSISTENCE_MODE=mysql` — reserved for a later controlled cutover. This PR does not route Trips responses through MySQL in this mode yet.

## Identity mapping prerequisite

Current TREK-derived SQLite rows use a local numeric user FK. Shared MySQL uses authoritative Kuklabs `users.id`.

`kuktrip_identity_migration_map` maps:

- local SQLite `users.id`
- Kuklabs `openId`
- authoritative shared MySQL `users.id`

If a mapping is absent, the shadow read is skipped and a bounded warning is logged. The user request is never failed because shadow verification is non-critical.

## What is compared

Product semantics:

- trip id
- title / description
- start/end date
- currency
- cover image
- archived/reminder state
- day count
- place count
- owner/member relationship flags and member count

The raw owner user id and owner display-name fields are deliberately excluded because the SQLite local identity namespace and shared Kuklabs identity namespace are not expected to be numerically/textually identical during transition.

## Promotion gate

Do not serve Trips reads from MySQL until:

1. target core schema has been applied to the canonical Kuklabs MySQL database;
2. identity mappings are complete for active KukTrip users;
3. trip/member/day/place data copy preserves the planned trip IDs;
4. shadow logs show no unexplained list/detail mismatches across a representative observation window;
5. authorization tests cover owner + collaborator + archived trips;
6. rollback to SQLite is rehearsed.

Writes remain SQLite-only during this stage. No dual-write is introduced here.
