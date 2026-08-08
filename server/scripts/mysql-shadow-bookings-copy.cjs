'use strict';

/**
 * Copy the next bounded KukTrip migration slice into shared Kuklabs MySQL:
 * day assignments + reservations + reservation endpoints.
 *
 * SAFE DEFAULT: dry run. Pass --apply to write.
 * Run the core shadow copier first so trips/days/places already exist.
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');

const apply = process.argv.includes('--apply');
const mysqlUrl = process.env.DATABASE_URL;
if (!mysqlUrl) { console.error('[kuktrip:bookings-shadow] DATABASE_URL is required'); process.exit(1); }
const sqlitePath = process.env.TREK_DB_FILE || path.resolve(__dirname, '../data/travel.db');
if (!fs.existsSync(sqlitePath)) { console.error(`[kuktrip:bookings-shadow] SQLite source not found: ${sqlitePath}`); process.exit(1); }

function tableExists(db, name) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));
}
function rows(db, sql, ...params) { return db.prepare(sql).all(...params); }
function count(db, table) { return tableExists(db, table) ? Number(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n) : 0; }

async function verifyTarget(conn) {
  const required = ['kuktrip_trips','kuktrip_days','kuktrip_places','kuktrip_day_assignments','kuktrip_reservations','kuktrip_reservation_endpoints'];
  const [found] = await conn.query(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN (${required.map(()=>'?').join(',')})`, required);
  const names = new Set(found.map(r => r.TABLE_NAME));
  const missing = required.filter(n => !names.has(n));
  if (missing.length) throw new Error(`Target schema missing: ${missing.join(', ')}`);
}

async function main() {
  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const conn = await mysql.createConnection(mysqlUrl);
  try {
    sqlite.pragma('query_only = ON');
    const quickCheck = sqlite.pragma('quick_check', { simple: true });
    if (quickCheck !== 'ok') throw new Error(`SQLite quick_check failed: ${quickCheck}`);
    await verifyTarget(conn);

    const source = {
      assignments: count(sqlite, 'day_assignments'),
      reservations: count(sqlite, 'reservations'),
      reservationEndpoints: count(sqlite, 'reservation_endpoints'),
    };
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', sqlitePath, sqliteQuickCheck: quickCheck, source }, null, 2));
    if (!apply) {
      console.log('[kuktrip:bookings-shadow] DRY RUN ONLY — zero MySQL rows written.');
      return;
    }

    await conn.beginTransaction();
    try {
      if (tableExists(sqlite, 'day_assignments')) {
        for (const a of rows(sqlite, 'SELECT * FROM day_assignments ORDER BY id')) {
          await conn.execute(
            `INSERT INTO kuktrip_day_assignments
             (ka_id,ka_dayId,ka_placeId,ka_orderIndex,ka_notes,ka_assignmentTime,ka_assignmentEndTime)
             VALUES (?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE ka_dayId=VALUES(ka_dayId),ka_placeId=VALUES(ka_placeId),ka_orderIndex=VALUES(ka_orderIndex),ka_notes=VALUES(ka_notes),ka_assignmentTime=VALUES(ka_assignmentTime),ka_assignmentEndTime=VALUES(ka_assignmentEndTime)`,
            [a.id,a.day_id,a.place_id,a.order_index || 0,a.notes || null,a.assignment_time || a.reservation_datetime || null,a.assignment_end_time || null],
          );
        }
      }

      if (tableExists(sqlite, 'reservations')) {
        for (const r of rows(sqlite, 'SELECT * FROM reservations ORDER BY id')) {
          await conn.execute(
            `INSERT INTO kuktrip_reservations
             (kr_id,kr_tripId,kr_dayId,kr_endDayId,kr_placeId,kr_assignmentId,kr_title,kr_type,kr_status,kr_reservationTime,kr_reservationEndTime,kr_location,kr_confirmationNumber,kr_notes,kr_url,kr_metadata,kr_needsReview,kr_externalSource,kr_externalId,kr_syncEnabled,kr_externalSyncedAt)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE
               kr_tripId=VALUES(kr_tripId),kr_dayId=VALUES(kr_dayId),kr_endDayId=VALUES(kr_endDayId),kr_placeId=VALUES(kr_placeId),kr_assignmentId=VALUES(kr_assignmentId),
               kr_title=VALUES(kr_title),kr_type=VALUES(kr_type),kr_status=VALUES(kr_status),kr_reservationTime=VALUES(kr_reservationTime),kr_reservationEndTime=VALUES(kr_reservationEndTime),
               kr_location=VALUES(kr_location),kr_confirmationNumber=VALUES(kr_confirmationNumber),kr_notes=VALUES(kr_notes),kr_url=VALUES(kr_url),kr_metadata=VALUES(kr_metadata),
               kr_needsReview=VALUES(kr_needsReview),kr_externalSource=VALUES(kr_externalSource),kr_externalId=VALUES(kr_externalId),kr_syncEnabled=VALUES(kr_syncEnabled),kr_externalSyncedAt=VALUES(kr_externalSyncedAt)`,
            [r.id,r.trip_id,r.day_id ?? null,r.end_day_id ?? null,r.place_id ?? null,r.assignment_id ?? null,r.title,r.type || 'other',r.status || 'planned',r.reservation_time ?? null,r.reservation_end_time ?? null,r.location ?? null,r.confirmation_number ?? null,r.notes ?? null,r.url ?? null,r.metadata ?? null,r.needs_review ? 1 : 0,r.external_source ?? null,r.external_id ?? null,r.sync_enabled ? 1 : 0,r.external_synced_at ?? null],
          );
        }
      }

      if (tableExists(sqlite, 'reservation_endpoints')) {
        for (const e of rows(sqlite, 'SELECT * FROM reservation_endpoints ORDER BY reservation_id, sequence, id')) {
          // Existing service only persists coordinate-bearing endpoints; preserve
          // current rows exactly and retain IDs for parity diagnostics.
          await conn.execute(
            `INSERT INTO kuktrip_reservation_endpoints
             (kre_id,kre_reservationId,kre_role,kre_sequence,kre_name,kre_code,kre_lat,kre_lng,kre_timezone,kre_localTime,kre_localDate)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE kre_reservationId=VALUES(kre_reservationId),kre_role=VALUES(kre_role),kre_sequence=VALUES(kre_sequence),kre_name=VALUES(kre_name),kre_code=VALUES(kre_code),kre_lat=VALUES(kre_lat),kre_lng=VALUES(kre_lng),kre_timezone=VALUES(kre_timezone),kre_localTime=VALUES(kre_localTime),kre_localDate=VALUES(kre_localDate)`,
            [e.id,e.reservation_id,e.role,e.sequence || 0,e.name,e.code ?? null,e.lat ?? null,e.lng ?? null,e.timezone ?? null,e.local_time ?? null,e.local_date ?? null],
          );
        }
      }
      await conn.commit();
    } catch (error) { await conn.rollback(); throw error; }

    const targetCounts = {};
    for (const [key, table] of Object.entries({ assignments:'kuktrip_day_assignments', reservations:'kuktrip_reservations', reservationEndpoints:'kuktrip_reservation_endpoints' })) {
      const [r] = await conn.query(`SELECT COUNT(*) AS n FROM ${table}`); targetCounts[key] = Number(r[0].n);
    }
    console.log('[kuktrip:bookings-shadow] apply committed');
    console.log(JSON.stringify({ source, targetCounts }, null, 2));
    for (const key of Object.keys(source)) {
      if (targetCounts[key] < source[key]) throw new Error(`Post-copy count gate failed for ${key}: source=${source[key]} target=${targetCounts[key]}`);
    }
  } finally { try { sqlite.close(); } catch {} await conn.end(); }
}

main().catch(error => { console.error('[kuktrip:bookings-shadow] failed:', error?.message || error); process.exit(1); });
