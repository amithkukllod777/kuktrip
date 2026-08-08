'use strict';

/**
 * KukTrip SQLite -> shared Kuklabs MySQL shadow copier.
 *
 * SAFE DEFAULT: dry-run only. Add --apply to write.
 *
 * Examples:
 *   DATABASE_URL='mysql://...' node server/scripts/mysql-shadow-copy.cjs
 *   DATABASE_URL='mysql://...' TREK_DB_FILE='/data/travel.db' node server/scripts/mysql-shadow-copy.cjs --apply
 *
 * Scope is intentionally bounded to the first parity domain:
 * identities + trips + trip_members + days + places.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');

const apply = process.argv.includes('--apply');
const mysqlUrl = process.env.DATABASE_URL;
if (!mysqlUrl) {
  console.error('[kuktrip:shadow-copy] DATABASE_URL is required');
  process.exit(1);
}

const sqlitePath = process.env.TREK_DB_FILE || path.resolve(__dirname, '../data/travel.db');
if (!fs.existsSync(sqlitePath)) {
  console.error(`[kuktrip:shadow-copy] SQLite source not found: ${sqlitePath}`);
  process.exit(1);
}

function rows(db, sql, ...params) {
  return db.prepare(sql).all(...params);
}

function scalar(db, sql, ...params) {
  const row = db.prepare(sql).get(...params);
  return row ? Object.values(row)[0] : 0;
}

async function verifyTarget(conn) {
  const required = [
    'users',
    'kuktrip_trips',
    'kuktrip_trip_members',
    'kuktrip_days',
    'kuktrip_places',
    'kuktrip_identity_migration_map',
  ];
  const [found] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${required.map(() => '?').join(',')})`,
    required,
  );
  const names = new Set(found.map(r => r.TABLE_NAME));
  const missing = required.filter(name => !names.has(name));
  if (missing.length) throw new Error(`Target schema missing: ${missing.join(', ')}. Apply shared MySQL schema first.`);
}

async function buildIdentityMap(sqlite, conn) {
  const localUsers = rows(
    sqlite,
    `SELECT id, oidc_sub AS openId
       FROM users
      WHERE oidc_issuer = 'kuklabs' AND oidc_sub IS NOT NULL AND TRIM(oidc_sub) <> ''`,
  );
  if (!localUsers.length) return { map: new Map(), localUsers, missing: [] };

  const openIds = localUsers.map(u => u.openId);
  const [sharedRows] = await conn.query(
    `SELECT id, openId FROM users WHERE openId IN (${openIds.map(() => '?').join(',')})`,
    openIds,
  );
  const byOpenId = new Map(sharedRows.map(u => [String(u.openId), Number(u.id)]));
  const map = new Map();
  const missing = [];
  for (const user of localUsers) {
    const sharedId = byOpenId.get(String(user.openId));
    if (sharedId == null) missing.push({ localUserId: Number(user.id), openId: String(user.openId) });
    else map.set(Number(user.id), { sharedUserId: sharedId, openId: String(user.openId) });
  }
  return { map, localUsers, missing };
}

function referencedUserIds(sqlite) {
  const ids = new Set();
  for (const row of rows(sqlite, 'SELECT user_id FROM trips')) ids.add(Number(row.user_id));
  for (const row of rows(sqlite, 'SELECT user_id FROM trip_members')) ids.add(Number(row.user_id));
  return ids;
}

async function main() {
  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const conn = await mysql.createConnection(mysqlUrl);
  try {
    sqlite.pragma('query_only = ON');
    const quickCheck = sqlite.pragma('quick_check', { simple: true });
    if (quickCheck !== 'ok') throw new Error(`SQLite quick_check failed: ${quickCheck}`);
    await verifyTarget(conn);

    const identities = await buildIdentityMap(sqlite, conn);
    const referenced = referencedUserIds(sqlite);
    const unmappedReferenced = [...referenced].filter(id => !identities.map.has(id));

    const source = {
      usersLinkedToKuklabs: identities.localUsers.length,
      trips: Number(scalar(sqlite, 'SELECT COUNT(*) AS n FROM trips')),
      members: Number(scalar(sqlite, 'SELECT COUNT(*) AS n FROM trip_members')),
      days: Number(scalar(sqlite, 'SELECT COUNT(*) AS n FROM days')),
      places: Number(scalar(sqlite, 'SELECT COUNT(*) AS n FROM places')),
    };

    const report = {
      mode: apply ? 'apply' : 'dry-run',
      sqlitePath,
      sqliteQuickCheck: quickCheck,
      source,
      mappedUsers: identities.map.size,
      missingSharedAccounts: identities.missing,
      unmappedReferencedLocalUserIds: unmappedReferenced,
    };
    console.log(JSON.stringify(report, null, 2));

    if (unmappedReferenced.length) {
      throw new Error(
        `Refusing ${apply ? 'apply' : 'promotion'}: ${unmappedReferenced.length} trip-referenced local users have no authoritative Kuklabs mapping`,
      );
    }

    if (!apply) {
      console.log('[kuktrip:shadow-copy] DRY RUN ONLY — no MySQL rows written. Re-run with --apply after reviewing the report.');
      return;
    }

    await conn.beginTransaction();
    try {
      for (const [localUserId, identity] of identities.map.entries()) {
        await conn.execute(
          `INSERT INTO kuktrip_identity_migration_map
             (kim_localUserId, kim_openId, kim_sharedUserId)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE kim_openId=VALUES(kim_openId), kim_sharedUserId=VALUES(kim_sharedUserId)`,
          [localUserId, identity.openId, identity.sharedUserId],
        );
      }

      const trips = rows(sqlite, `SELECT id, user_id, title, description, start_date, end_date, currency, cover_image, is_archived, reminder_days FROM trips ORDER BY id`);
      for (const t of trips) {
        const owner = identities.map.get(Number(t.user_id));
        await conn.execute(
          `INSERT INTO kuktrip_trips
            (kt_id, kt_companyId, kt_ownerUserId, kt_title, kt_description, kt_startDate, kt_endDate, kt_currency, kt_coverImage, kt_isArchived, kt_reminderDays)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             kt_ownerUserId=VALUES(kt_ownerUserId), kt_title=VALUES(kt_title), kt_description=VALUES(kt_description),
             kt_startDate=VALUES(kt_startDate), kt_endDate=VALUES(kt_endDate), kt_currency=VALUES(kt_currency),
             kt_coverImage=VALUES(kt_coverImage), kt_isArchived=VALUES(kt_isArchived), kt_reminderDays=VALUES(kt_reminderDays)`,
          [t.id, owner.sharedUserId, t.title, t.description, t.start_date, t.end_date, t.currency || 'EUR', t.cover_image, t.is_archived || 0, t.reminder_days ?? 3],
        );
      }

      const members = rows(sqlite, 'SELECT trip_id, user_id FROM trip_members ORDER BY id');
      for (const m of members) {
        const identity = identities.map.get(Number(m.user_id));
        await conn.execute(
          `INSERT INTO kuktrip_trip_members (ktm_tripId, ktm_userId, ktm_role)
           VALUES (?, ?, 'member')
           ON DUPLICATE KEY UPDATE ktm_role=VALUES(ktm_role)`,
          [m.trip_id, identity.sharedUserId],
        );
      }

      const days = rows(sqlite, 'SELECT id, trip_id, day_number, date, title, notes FROM days ORDER BY id');
      for (const d of days) {
        await conn.execute(
          `INSERT INTO kuktrip_days (kd_id, kd_tripId, kd_dayNumber, kd_date, kd_title, kd_notes)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE kd_tripId=VALUES(kd_tripId), kd_dayNumber=VALUES(kd_dayNumber), kd_date=VALUES(kd_date), kd_title=VALUES(kd_title), kd_notes=VALUES(kd_notes)`,
          [d.id, d.trip_id, d.day_number, d.date, d.title, d.notes],
        );
      }

      const places = rows(sqlite, `SELECT id, trip_id, name, description, lat, lng, address, category_id, price, currency, place_time, end_time, duration_minutes, notes, image_url, google_place_id, google_ftid, osm_id, website, phone, transport_mode, route_geometry FROM places ORDER BY id`);
      for (const p of places) {
        await conn.execute(
          `INSERT INTO kuktrip_places
            (kp_id, kp_tripId, kp_name, kp_description, kp_lat, kp_lng, kp_address, kp_categoryId, kp_price, kp_currency, kp_placeTime, kp_endTime, kp_durationMinutes, kp_notes, kp_imageUrl, kp_googlePlaceId, kp_googleFtid, kp_osmId, kp_website, kp_phone, kp_transportMode, kp_routeGeometry)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             kp_tripId=VALUES(kp_tripId), kp_name=VALUES(kp_name), kp_description=VALUES(kp_description), kp_lat=VALUES(kp_lat), kp_lng=VALUES(kp_lng),
             kp_address=VALUES(kp_address), kp_categoryId=VALUES(kp_categoryId), kp_price=VALUES(kp_price), kp_currency=VALUES(kp_currency),
             kp_placeTime=VALUES(kp_placeTime), kp_endTime=VALUES(kp_endTime), kp_durationMinutes=VALUES(kp_durationMinutes), kp_notes=VALUES(kp_notes),
             kp_imageUrl=VALUES(kp_imageUrl), kp_googlePlaceId=VALUES(kp_googlePlaceId), kp_googleFtid=VALUES(kp_googleFtid), kp_osmId=VALUES(kp_osmId),
             kp_website=VALUES(kp_website), kp_phone=VALUES(kp_phone), kp_transportMode=VALUES(kp_transportMode), kp_routeGeometry=VALUES(kp_routeGeometry)`,
          [p.id, p.trip_id, p.name, p.description, p.lat, p.lng, p.address, p.category_id, p.price, p.currency, p.place_time, p.end_time, p.duration_minutes, p.notes, p.image_url, p.google_place_id, p.google_ftid, p.osm_id, p.website, p.phone, p.transport_mode, p.route_geometry],
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    }

    const targetCounts = {};
    for (const [key, table] of Object.entries({
      trips: 'kuktrip_trips',
      members: 'kuktrip_trip_members',
      days: 'kuktrip_days',
      places: 'kuktrip_places',
    })) {
      const [r] = await conn.query(`SELECT COUNT(*) AS n FROM ${table}`);
      targetCounts[key] = Number(r[0].n);
    }
    console.log('[kuktrip:shadow-copy] apply committed');
    console.log(JSON.stringify({ source, targetCounts }, null, 2));
  } finally {
    try { sqlite.close(); } catch {}
    await conn.end();
  }
}

main().catch(error => {
  console.error('[kuktrip:shadow-copy] failed:', error && error.message ? error.message : error);
  process.exit(1);
});
