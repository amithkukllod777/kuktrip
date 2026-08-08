import { getPersistenceMode } from '../db/sharedMysql';
import { getTripFromSharedMysql, listTripsFromSharedMysql, type MysqlTripRow } from '../repositories/mysqlTripRepository';

const loggedMissingIdentity = new Set<number>();

/**
 * Compare only product semantics that are expected to be byte-equivalent after
 * migration. SQLite `user_id` is a transitional local FK while MySQL stores the
 * authoritative shared Kuklabs users.id, so identity columns are intentionally
 * excluded from the parity payload.
 */
function normalizeTrip(value: any) {
  if (!value) return null;
  return {
    id: Number(value.id),
    title: String(value.title || ''),
    description: value.description == null ? null : String(value.description),
    start_date: value.start_date == null ? null : String(value.start_date).slice(0, 10),
    end_date: value.end_date == null ? null : String(value.end_date).slice(0, 10),
    currency: String(value.currency || 'EUR'),
    cover_image: value.cover_image == null ? null : String(value.cover_image),
    is_archived: Number(value.is_archived || 0),
    reminder_days: Number(value.reminder_days ?? 3),
    day_count: Number(value.day_count || 0),
    place_count: Number(value.place_count || 0),
    is_owner: Number(value.is_owner || 0),
    shared_count: Number(value.shared_count || 0),
  };
}

function stable(value: unknown): string {
  return JSON.stringify(value);
}

function warnMissingMap(userId: number): void {
  if (loggedMissingIdentity.has(userId)) return;
  loggedMissingIdentity.add(userId);
  console.warn(`[KukTripMySQLShadow] local user ${userId} has no identity migration map; parity check skipped`);
}

function compareOne(label: string, sqlite: unknown, mysql: MysqlTripRow | null): void {
  const left = normalizeTrip(sqlite);
  const right = normalizeTrip(mysql);
  if (stable(left) !== stable(right)) {
    console.warn(`[KukTripMySQLShadow] ${label} mismatch`, { sqlite: left, mysql: right });
  }
}

export function shadowCompareTripList(localUserId: number, archived: number | null, sqliteRows: unknown[]): void {
  if (getPersistenceMode() !== 'mysql-shadow') return;
  void listTripsFromSharedMysql(localUserId, archived)
    .then(mysqlRows => {
      if (mysqlRows == null) return warnMissingMap(localUserId);
      const sqliteById = new Map(sqliteRows.map((row: any) => [Number(row.id), row]));
      const mysqlById = new Map(mysqlRows.map(row => [Number(row.id), row]));
      const ids = [...new Set([...sqliteById.keys(), ...mysqlById.keys()])].sort((a, b) => a - b);
      const mismatches = ids.filter(id => stable(normalizeTrip(sqliteById.get(id))) !== stable(normalizeTrip(mysqlById.get(id))));
      if (mismatches.length) {
        console.warn('[KukTripMySQLShadow] trip list mismatch', {
          localUserId,
          archived,
          sqliteCount: sqliteRows.length,
          mysqlCount: mysqlRows.length,
          mismatchedTripIds: mismatches.slice(0, 50),
        });
      }
    })
    .catch(error => {
      console.warn('[KukTripMySQLShadow] trip list comparison failed', error instanceof Error ? error.message : error);
    });
}

export function shadowCompareTrip(localUserId: number, tripId: string | number, sqliteRow: unknown): void {
  if (getPersistenceMode() !== 'mysql-shadow') return;
  void getTripFromSharedMysql(localUserId, tripId)
    .then(mysqlRow => {
      if (mysqlRow === undefined) return warnMissingMap(localUserId);
      compareOne(`trip ${tripId}`, sqliteRow, mysqlRow);
    })
    .catch(error => {
      console.warn(`[KukTripMySQLShadow] trip ${tripId} comparison failed`, error instanceof Error ? error.message : error);
    });
}
