'use strict';

/**
 * KukTrip shared-MySQL core schema (additive, idempotent).
 *
 * This script creates KukTrip-owned product tables inside the ONE Kuklabs MySQL
 * database. It never creates a users/auth table and never drops/retypes data.
 *
 * Run only against an explicitly supplied Kuklabs DATABASE_URL:
 *   DATABASE_URL='mysql://...' node server/scripts/shared-mysql-core.cjs
 */

const mysql = require('mysql2/promise');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[kuktrip:mysql] DATABASE_URL is required');
  process.exit(1);
}

const ddls = [
  `CREATE TABLE IF NOT EXISTS kuktrip_trips (
    kt_id INT AUTO_INCREMENT PRIMARY KEY,
    kt_companyId INT NULL,
    kt_ownerUserId INT NOT NULL,
    kt_title VARCHAR(200) NOT NULL,
    kt_description TEXT NULL,
    kt_startDate DATE NULL,
    kt_endDate DATE NULL,
    kt_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    kt_coverImage VARCHAR(1000) NULL,
    kt_isArchived TINYINT(1) NOT NULL DEFAULT 0,
    kt_reminderDays INT NOT NULL DEFAULT 3,
    kt_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kt_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_kt_trip_owner (kt_ownerUserId),
    KEY idx_kt_trip_company (kt_companyId),
    KEY idx_kt_trip_owner_archived (kt_ownerUserId, kt_isArchived)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_trip_members (
    ktm_id INT AUTO_INCREMENT PRIMARY KEY,
    ktm_tripId INT NOT NULL,
    ktm_userId INT NOT NULL,
    ktm_role VARCHAR(32) NOT NULL DEFAULT 'member',
    ktm_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ktm_trip_user (ktm_tripId, ktm_userId),
    KEY idx_ktm_user (ktm_userId),
    CONSTRAINT fk_ktm_trip FOREIGN KEY (ktm_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_days (
    kd_id INT AUTO_INCREMENT PRIMARY KEY,
    kd_tripId INT NOT NULL,
    kd_dayNumber INT NOT NULL,
    kd_date DATE NULL,
    kd_title VARCHAR(200) NULL,
    kd_notes TEXT NULL,
    kd_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kd_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kd_trip_day (kd_tripId, kd_dayNumber),
    KEY idx_kd_trip_date (kd_tripId, kd_date),
    CONSTRAINT fk_kd_trip FOREIGN KEY (kd_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_day_notes (
    kdn_id INT AUTO_INCREMENT PRIMARY KEY,
    kdn_dayId INT NOT NULL,
    kdn_text TEXT NOT NULL,
    kdn_time VARCHAR(16) NULL,
    kdn_icon VARCHAR(64) NULL,
    kdn_sortOrder INT NOT NULL DEFAULT 0,
    kdn_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_kdn_day (kdn_dayId),
    CONSTRAINT fk_kdn_day FOREIGN KEY (kdn_dayId) REFERENCES kuktrip_days(kd_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_places (
    kp_id INT AUTO_INCREMENT PRIMARY KEY,
    kp_tripId INT NOT NULL,
    kp_name VARCHAR(200) NOT NULL,
    kp_description TEXT NULL,
    kp_lat DECIMAL(10,7) NULL,
    kp_lng DECIMAL(10,7) NULL,
    kp_address VARCHAR(500) NULL,
    kp_categoryId INT NULL,
    kp_price DECIMAL(15,2) NULL,
    kp_currency VARCHAR(3) NULL,
    kp_placeTime VARCHAR(16) NULL,
    kp_endTime VARCHAR(16) NULL,
    kp_durationMinutes INT NULL DEFAULT 60,
    kp_notes TEXT NULL,
    kp_imageUrl VARCHAR(1000) NULL,
    kp_googlePlaceId VARCHAR(255) NULL,
    kp_googleFtid VARCHAR(255) NULL,
    kp_osmId VARCHAR(255) NULL,
    kp_website VARCHAR(1000) NULL,
    kp_phone VARCHAR(100) NULL,
    kp_transportMode VARCHAR(32) NULL DEFAULT 'walking',
    kp_routeGeometry MEDIUMTEXT NULL,
    kp_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kp_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_kp_trip (kp_tripId),
    KEY idx_kp_trip_name (kp_tripId, kp_name),
    KEY idx_kp_google (kp_googlePlaceId),
    CONSTRAINT fk_kp_trip FOREIGN KEY (kp_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_day_assignments (
    ka_id INT AUTO_INCREMENT PRIMARY KEY,
    ka_dayId INT NOT NULL,
    ka_placeId INT NOT NULL,
    ka_orderIndex INT NOT NULL DEFAULT 0,
    ka_notes TEXT NULL,
    ka_assignmentTime VARCHAR(16) NULL,
    ka_assignmentEndTime VARCHAR(16) NULL,
    ka_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_ka_day_order (ka_dayId, ka_orderIndex),
    KEY idx_ka_place (ka_placeId),
    CONSTRAINT fk_ka_day FOREIGN KEY (ka_dayId) REFERENCES kuktrip_days(kd_id) ON DELETE CASCADE,
    CONSTRAINT fk_ka_place FOREIGN KEY (ka_placeId) REFERENCES kuktrip_places(kp_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_reservations (
    kr_id INT AUTO_INCREMENT PRIMARY KEY,
    kr_tripId INT NOT NULL,
    kr_dayId INT NULL,
    kr_endDayId INT NULL,
    kr_placeId INT NULL,
    kr_assignmentId INT NULL,
    kr_title VARCHAR(500) NOT NULL,
    kr_type VARCHAR(64) NOT NULL DEFAULT 'other',
    kr_status VARCHAR(64) NOT NULL DEFAULT 'planned',
    kr_reservationTime VARCHAR(64) NULL,
    kr_reservationEndTime VARCHAR(64) NULL,
    kr_location VARCHAR(500) NULL,
    kr_confirmationNumber VARCHAR(255) NULL,
    kr_notes TEXT NULL,
    kr_url VARCHAR(1000) NULL,
    kr_metadata MEDIUMTEXT NULL,
    kr_needsReview TINYINT(1) NOT NULL DEFAULT 0,
    kr_externalSource VARCHAR(64) NULL,
    kr_externalId VARCHAR(255) NULL,
    kr_syncEnabled TINYINT(1) NULL DEFAULT 0,
    kr_externalSyncedAt TIMESTAMP NULL,
    kr_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kr_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_kr_trip (kr_tripId),
    KEY idx_kr_trip_time (kr_tripId, kr_reservationTime),
    KEY idx_kr_day (kr_dayId),
    CONSTRAINT fk_kr_trip FOREIGN KEY (kr_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE,
    CONSTRAINT fk_kr_day FOREIGN KEY (kr_dayId) REFERENCES kuktrip_days(kd_id) ON DELETE SET NULL,
    CONSTRAINT fk_kr_end_day FOREIGN KEY (kr_endDayId) REFERENCES kuktrip_days(kd_id) ON DELETE SET NULL,
    CONSTRAINT fk_kr_place FOREIGN KEY (kr_placeId) REFERENCES kuktrip_places(kp_id) ON DELETE SET NULL,
    CONSTRAINT fk_kr_assignment FOREIGN KEY (kr_assignmentId) REFERENCES kuktrip_day_assignments(ka_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_reservation_endpoints (
    kre_id INT AUTO_INCREMENT PRIMARY KEY,
    kre_reservationId INT NOT NULL,
    kre_role VARCHAR(16) NOT NULL,
    kre_sequence INT NOT NULL DEFAULT 0,
    kre_name VARCHAR(255) NOT NULL,
    kre_code VARCHAR(32) NULL,
    kre_lat DECIMAL(10,7) NULL,
    kre_lng DECIMAL(10,7) NULL,
    kre_timezone VARCHAR(100) NULL,
    kre_localTime VARCHAR(64) NULL,
    kre_localDate VARCHAR(16) NULL,
    KEY idx_kre_reservation (kre_reservationId, kre_sequence),
    CONSTRAINT fk_kre_reservation FOREIGN KEY (kre_reservationId) REFERENCES kuktrip_reservations(kr_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_identity_migration_map (
    kim_localUserId INT NOT NULL PRIMARY KEY,
    kim_openId VARCHAR(64) NOT NULL,
    kim_sharedUserId INT NOT NULL,
    kim_migratedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kim_openid (kim_openId),
    KEY idx_kim_shared_user (kim_sharedUserId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function verifyPlatformContract(conn) {
  const [columns] = await conn.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('id','openId')`,
  );
  const names = new Set(columns.map((row) => row.COLUMN_NAME));
  if (!names.has('id') || !names.has('openId')) {
    throw new Error('Shared Kuklabs users(id, openId) contract not found in target DATABASE_URL');
  }
}

(async () => {
  const conn = await mysql.createConnection(url);
  try {
    await verifyPlatformContract(conn);
    for (const ddl of ddls) await conn.execute(ddl);
    console.log(`[kuktrip:mysql] core schema OK (${ddls.length} tables)`);
    console.log('[kuktrip:mysql] no runtime cutover or SQLite data copy was performed');
  } finally {
    await conn.end();
  }
})().catch((error) => {
  console.error('[kuktrip:mysql] migration failed:', error?.message || error);
  process.exit(1);
});
