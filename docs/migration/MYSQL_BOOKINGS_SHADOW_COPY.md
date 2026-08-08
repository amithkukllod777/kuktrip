# KukTrip bookings shadow copy

This is the second bounded SQLite → shared Kuklabs MySQL parity slice.

It covers:
- day assignments
- reservations
- reservation endpoints

## Safe sequence

1. Apply `server/scripts/shared-mysql-core.cjs` to the canonical Kuklabs MySQL database.
2. Run the core `mysql-shadow-copy.cjs` first so trips, days and places exist.
3. Dry run:

```bash
DATABASE_URL='mysql://...' TREK_DB_FILE='/data/travel.db' node server/scripts/mysql-shadow-bookings-copy.cjs
```

4. Review source counts and SQLite quick-check.
5. Apply only after the dry run is clean:

```bash
DATABASE_URL='mysql://...' TREK_DB_FILE='/data/travel.db' node server/scripts/mysql-shadow-bookings-copy.cjs --apply
```

The apply runs in one MySQL transaction, preserves source IDs, uses repeatable upserts and prints target counts. It never deletes SQLite data and does not switch runtime reads/writes.

## Promotion gate

Do not route bookings reads/writes to MySQL until API-level parity has been observed for representative trips, including multi-day reservations, assignment-linked bookings and transport endpoints.
