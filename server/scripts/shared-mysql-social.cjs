'use strict';

/**
 * KukTrip Explore/social schema. Shared-MySQL only — never SQLite.
 * Run after shared-mysql-core.cjs on an explicitly supplied DATABASE_URL.
 */

const mysql = require('mysql2/promise');
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[kuktrip:social] DATABASE_URL is required');
  process.exit(1);
}

const ddls = [
  `CREATE TABLE IF NOT EXISTS kuktrip_traveler_discovery_preferences (
    ktdp_userId INT NOT NULL PRIMARY KEY,
    ktdp_discoveryEnabled TINYINT(1) NOT NULL DEFAULT 0,
    ktdp_showUpcomingDestinations TINYINT(1) NOT NULL DEFAULT 0,
    ktdp_visibility VARCHAR(24) NOT NULL DEFAULT 'private',
    ktdp_interests JSON NULL,
    ktdp_ageBand VARCHAR(24) NULL,
    ktdp_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ktdp_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_ktdp_discovery (ktdp_discoveryEnabled, ktdp_visibility)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_activities (
    kac_id INT AUTO_INCREMENT PRIMARY KEY,
    kac_companyId INT NULL,
    kac_tripId INT NULL,
    kac_hostUserId INT NOT NULL,
    kac_title VARCHAR(200) NOT NULL,
    kac_category VARCHAR(64) NOT NULL,
    kac_description TEXT NULL,
    kac_destination VARCHAR(200) NULL,
    kac_area VARCHAR(200) NULL,
    kac_startAt DATETIME NOT NULL,
    kac_endAt DATETIME NULL,
    kac_timezone VARCHAR(100) NULL,
    kac_capacity INT NULL,
    kac_visibility VARCHAR(24) NOT NULL DEFAULT 'public',
    kac_joinMode VARCHAR(24) NOT NULL DEFAULT 'approval',
    kac_agePolicy VARCHAR(32) NOT NULL DEFAULT 'adults_only',
    kac_locationPrivacy VARCHAR(32) NOT NULL DEFAULT 'approximate_until_joined',
    kac_publicLat DECIMAL(8,5) NULL,
    kac_publicLng DECIMAL(8,5) NULL,
    kac_meetingLabel VARCHAR(500) NULL,
    kac_meetingLat DECIMAL(10,7) NULL,
    kac_meetingLng DECIMAL(10,7) NULL,
    kac_status VARCHAR(24) NOT NULL DEFAULT 'active',
    kac_moderationStatus VARCHAR(24) NOT NULL DEFAULT 'clear',
    kac_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kac_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_kac_destination_time (kac_destination, kac_startAt),
    KEY idx_kac_public_geo (kac_publicLat, kac_publicLng),
    KEY idx_kac_host (kac_hostUserId),
    KEY idx_kac_trip (kac_tripId),
    KEY idx_kac_status (kac_status, kac_moderationStatus),
    CONSTRAINT fk_kac_trip FOREIGN KEY (kac_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_activity_participants (
    kap_id INT AUTO_INCREMENT PRIMARY KEY,
    kap_activityId INT NOT NULL,
    kap_userId INT NOT NULL,
    kap_role VARCHAR(24) NOT NULL DEFAULT 'participant',
    kap_status VARCHAR(24) NOT NULL DEFAULT 'pending',
    kap_joinedAt TIMESTAMP NULL,
    kap_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kap_activity_user (kap_activityId, kap_userId),
    KEY idx_kap_user_status (kap_userId, kap_status),
    CONSTRAINT fk_kap_activity FOREIGN KEY (kap_activityId) REFERENCES kuktrip_activities(kac_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_user_blocks (
    kub_id INT AUTO_INCREMENT PRIMARY KEY,
    kub_blockerUserId INT NOT NULL,
    kub_blockedUserId INT NOT NULL,
    kub_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_kub_pair (kub_blockerUserId, kub_blockedUserId),
    KEY idx_kub_blocked (kub_blockedUserId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_activity_reports (
    kar_id INT AUTO_INCREMENT PRIMARY KEY,
    kar_activityId INT NULL,
    kar_reporterUserId INT NOT NULL,
    kar_reportedUserId INT NULL,
    kar_reason VARCHAR(64) NOT NULL,
    kar_details TEXT NULL,
    kar_status VARCHAR(24) NOT NULL DEFAULT 'open',
    kar_reviewedByUserId INT NULL,
    kar_reviewedAt TIMESTAMP NULL,
    kar_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_kar_status (kar_status, kar_createdAt),
    KEY idx_kar_activity (kar_activityId),
    KEY idx_kar_reported_user (kar_reportedUserId),
    CONSTRAINT fk_kar_activity FOREIGN KEY (kar_activityId) REFERENCES kuktrip_activities(kac_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_activity_messages (
    kam_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kam_activityId INT NOT NULL,
    kam_senderUserId INT NOT NULL,
    kam_body TEXT NOT NULL,
    kam_status VARCHAR(24) NOT NULL DEFAULT 'visible',
    kam_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_kam_activity_time (kam_activityId, kam_createdAt),
    KEY idx_kam_sender (kam_senderUserId),
    CONSTRAINT fk_kam_activity FOREIGN KEY (kam_activityId) REFERENCES kuktrip_activities(kac_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS kuktrip_activity_invites (
    kai_id INT AUTO_INCREMENT PRIMARY KEY,
    kai_activityId INT NOT NULL,
    kai_inviterUserId INT NOT NULL,
    kai_inviteeUserId INT NOT NULL,
    kai_status VARCHAR(24) NOT NULL DEFAULT 'pending',
    kai_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kai_respondedAt TIMESTAMP NULL,
    UNIQUE KEY uq_kai_activity_invitee (kai_activityId, kai_inviteeUserId),
    KEY idx_kai_invitee_status (kai_inviteeUserId, kai_status),
    CONSTRAINT fk_kai_activity FOREIGN KEY (kai_activityId) REFERENCES kuktrip_activities(kac_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function verifyContract(conn) {
  const [users] = await conn.execute(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME IN ('id','openId')`,
  );
  const userCols = new Set(users.map((row) => row.COLUMN_NAME));
  if (!userCols.has('id') || !userCols.has('openId')) {
    throw new Error('Shared Kuklabs users(id, openId) contract not found');
  }

  const [core] = await conn.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='kuktrip_trips'`,
  );
  if (!core.length) throw new Error('kuktrip_trips not found; run shared-mysql-core.cjs first');
}

(async () => {
  const conn = await mysql.createConnection(url);
  try {
    await verifyContract(conn);
    for (const ddl of ddls) await conn.execute(ddl);
    console.log(`[kuktrip:social] Explore/social schema OK (${ddls.length} tables)`);
    console.log('[kuktrip:social] traveler discovery remains opt-in by default');
  } finally {
    await conn.end();
  }
})().catch((error) => {
  console.error('[kuktrip:social] migration failed:', error?.message || error);
  process.exit(1);
});
