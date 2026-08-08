# Shared MySQL Shadow Copy — First Domain

This tool copies only the data required for the first Trips read-parity stage:

- Kuklabs identity mappings
- trips
- trip members
- days
- places

## Safety default

Running without `--apply` is read-only:

```bash
DATABASE_URL='mysql://...' \
TREK_DB_FILE='/absolute/path/to/travel.db' \
node server/scripts/mysql-shadow-copy.cjs
```

It verifies SQLite `quick_check`, validates the target KukTrip schema, resolves local KukTrip users to authoritative shared Kuklabs `users.openId`, prints source counts, and refuses promotion if any trip owner/member cannot be mapped.

No target row is written in dry-run mode.

## Apply

Only after reviewing the dry-run report:

```bash
DATABASE_URL='mysql://...' \
TREK_DB_FILE='/absolute/path/to/travel.db' \
node server/scripts/mysql-shadow-copy.cjs --apply
```

The apply path runs in one MySQL transaction and preserves source IDs for trips, days and places. Re-running is idempotent through upserts.

## What this does NOT migrate yet

Assignments, reservations, budgets, packing, files, photos, polls, collaboration and other domains remain on SQLite. This is intentional: Trips read parity must be proven before expanding the migration surface.

## After apply

Run KukTrip with:

```bash
KUKTRIP_PERSISTENCE_MODE=mysql-shadow
```

User-facing reads still come from SQLite. The shadow reader compares shared-MySQL Trips list/detail results and reports mismatches without failing the request.

Do not set production read source to MySQL until the shadow-read promotion gates are satisfied.
