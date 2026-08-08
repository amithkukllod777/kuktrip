# KukTrip Shared MySQL Cutover Runbook

Status: P0 migration groundwork for issue #18.

## Why this is staged

The current TREK-derived runtime exposes synchronous `better-sqlite3` semantics (`prepare().get/all/run`, transactions, PRAGMAs) across many services. Replacing the connection object with an async MySQL driver in one commit would create a large, hard-to-review behavioral migration and unnecessary risk to live KukTrip/KukBook infrastructure.

The cutover therefore follows an evidence-first sequence.

## Phase 0 — inventory only

Run against a copy/snapshot of the current KukTrip SQLite database:

```bash
npm run db:inventory -- --db /absolute/path/to/travel.db --out evidence/kuktrip-sqlite-inventory.json
```

The command is read-only. It records:

- SQLite integrity `quick_check`
- every application table
- row counts
- columns/defaults/PK metadata
- foreign keys
- indexes and index columns
- triggers and views
- create SQL
- stable schema hashes
- ownership classification

Never publish generated evidence if it contains infrastructure paths that should remain private.

## Ownership rule

`users` and other standalone TREK identity/auth tables are classified as **identity-transitional**. They are not the target identity source.

The target architecture remains:

- one authoritative Kuklabs Account
- one authoritative Kuklabs user ID
- shared Kuklabs MySQL infrastructure
- KukTrip-owned product tables linked to that user ID
- no new KukTrip passwords/users/OTP/session silo

A compatibility row may remain temporarily during migration only where existing TREK services still require a numeric local FK. It must not become an authoritative account.

## Phase 1 — target schema design

For each `kuktrip-product` table in the inventory:

1. determine target MySQL table name/namespace;
2. translate SQLite affinity/default/index syntax explicitly;
3. replace local identity references with the authoritative Kuklabs user ID strategy;
4. preserve trip membership/authorization semantics;
5. document cascade/delete behavior rather than relying on implicit engine differences;
6. define target unique constraints and indexes;
7. identify data requiring type/date/boolean normalization.

No target schema is considered complete until every source table has an explicit disposition: migrate, transform, compatibility-only, or intentionally retire.

## Phase 2 — adapter boundary

Migrate domain services behind repositories/adapters instead of emulating all of `better-sqlite3` on MySQL.

Suggested order:

1. Trips + trip membership
2. Days + day notes
3. Places + categories/tags
4. Reservations
5. Budget/costs/splits
6. Packing/todos
7. Files/photos/journey/memories
8. Collaboration/polls/notifications
9. remaining addons/plugins

Each domain PR must be independently reversible.

## Phase 3 — migration dry run

A migration run must produce machine-readable evidence containing at least:

- source row count per table
- target row count per table
- rejected/transformed row count
- FK/orphan checks
- duplicate/unique-key conflicts
- identity mapping coverage
- duration
- source snapshot identifier
- target schema version

Dry-run or disposable-target execution comes before production writes.

## Phase 4 — verification

Minimum gates before cutover:

- source SQLite backup captured and restorable
- target backup/snapshot policy confirmed
- all source product rows accounted for
- no unmapped authoritative-user references
- trip ownership/membership authorization tests green
- client/server test suites green
- login + trip create/read/update/delete smoke test
- collaborator access test
- files/photos availability test
- restart/redeploy persistence test
- rollback rehearsal completed
- KukBook health checked independently

## Phase 5 — controlled cutover

Use additive deployment first. Do not delete SQLite or local compatibility identity data during the first production cutover.

The exact switching mechanism must be chosen after adapter coverage exists. Preferred properties:

- short or zero-write transition window
- explicit feature/config switch
- target health/readiness probe
- immediate rollback to known source snapshot when verification fails
- no schema cleanup in the same release

## Phase 6 — cleanup

Only after an observation period and successful backup/restore exercise:

- production-disable standalone TREK signup/password/reset paths
- remove compatibility reads no longer used
- retire SQLite production persistence
- remove identity-transitional product dependencies
- remove obsolete migration switches

Destructive cleanup is always a separate PR/release from initial cutover.

## Social/Explore dependency

New MigoMap-inspired KukTrip social persistence (activities, participants, traveler-discovery preferences, blocks/reports/moderation state) should be introduced directly on the shared MySQL architecture rather than adding new production SQLite debt.
