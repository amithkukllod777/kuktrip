'use strict';

/** KukTrip file/document metadata in the ONE Kuklabs MySQL DB. Binary storage stays external. */
const mysql = require('mysql2/promise');
const url = process.env.DATABASE_URL;
if (!url) { console.error('[kuktrip:files:mysql] DATABASE_URL is required'); process.exit(1); }

const ddl = `CREATE TABLE IF NOT EXISTS kuktrip_files (
  kf_id INT AUTO_INCREMENT PRIMARY KEY,
  kf_tripId INT NOT NULL,
  kf_placeId INT NULL,
  kf_reservationId INT NULL,
  kf_assignmentId INT NULL,
  kf_storageProvider VARCHAR(32) NOT NULL DEFAULT 'legacy-local',
  kf_storageKey VARCHAR(1000) NOT NULL,
  kf_originalName VARCHAR(500) NOT NULL,
  kf_fileSize BIGINT NULL,
  kf_mimeType VARCHAR(255) NULL,
  kf_description TEXT NULL,
  kf_createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  kf_updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_kf_trip (kf_tripId),
  KEY idx_kf_place (kf_placeId),
  KEY idx_kf_reservation (kf_reservationId),
  KEY idx_kf_assignment (kf_assignmentId),
  CONSTRAINT fk_kf_trip FOREIGN KEY (kf_tripId) REFERENCES kuktrip_trips(kt_id) ON DELETE CASCADE,
  CONSTRAINT fk_kf_place FOREIGN KEY (kf_placeId) REFERENCES kuktrip_places(kp_id) ON DELETE SET NULL,
  CONSTRAINT fk_kf_reservation FOREIGN KEY (kf_reservationId) REFERENCES kuktrip_reservations(kr_id) ON DELETE SET NULL,
  CONSTRAINT fk_kf_assignment FOREIGN KEY (kf_assignmentId) REFERENCES kuktrip_day_assignments(ka_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

(async () => {
  const conn = await mysql.createConnection(url);
  try {
    const [core] = await conn.execute(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('kuktrip_trips','kuktrip_places','kuktrip_reservations','kuktrip_day_assignments')`);
    if (core.length < 4) throw new Error('Apply KukTrip core schema before file metadata schema');
    await conn.execute(ddl);
    console.log('[kuktrip:files:mysql] metadata schema OK; no binary data moved');
  } finally { await conn.end(); }
})().catch(err => { console.error('[kuktrip:files:mysql] failed:', err?.message || err); process.exit(1); });
