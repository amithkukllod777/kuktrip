'use strict';

/** Dry-run-first metadata-only copier. File bytes are never moved by this script. */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');

const apply = process.argv.includes('--apply');
const mysqlUrl = process.env.DATABASE_URL;
if (!mysqlUrl) { console.error('[kuktrip:files-copy] DATABASE_URL is required'); process.exit(1); }
const sqlitePath = process.env.TREK_DB_FILE || path.resolve(__dirname, '../data/travel.db');
if (!fs.existsSync(sqlitePath)) { console.error(`[kuktrip:files-copy] SQLite source not found: ${sqlitePath}`); process.exit(1); }

function tableExists(db, name) { return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)); }
function columns(db, name) { return new Set(db.prepare(`PRAGMA table_info('${name}')`).all().map(r => r.name)); }

(async () => {
  const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
  const conn = await mysql.createConnection(mysqlUrl);
  try {
    sqlite.pragma('query_only = ON');
    const quick = sqlite.pragma('quick_check', { simple: true });
    if (quick !== 'ok') throw new Error(`SQLite quick_check failed: ${quick}`);
    if (!tableExists(sqlite, 'trip_files')) throw new Error('SQLite trip_files table not found');
    const [target] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kuktrip_files'");
    if (!target.length) throw new Error('Run shared-mysql-files.cjs first');

    const cols = columns(sqlite, 'trip_files');
    const assignmentExpr = cols.has('assignment_id') ? 'assignment_id' : 'NULL AS assignment_id';
    const sourceRows = sqlite.prepare(`SELECT id, trip_id, place_id, reservation_id, ${assignmentExpr}, filename, original_name, file_size, mime_type, description, created_at FROM trip_files ORDER BY id`).all();
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', sqlitePath, sqliteQuickCheck: quick, metadataRows: sourceRows.length, binaryBytesMoved: 0 }, null, 2));
    if (!apply) { console.log('[kuktrip:files-copy] DRY RUN ONLY — no MySQL rows written and no files moved.'); return; }

    await conn.beginTransaction();
    try {
      for (const f of sourceRows) {
        await conn.execute(
          `INSERT INTO kuktrip_files
           (kf_id,kf_tripId,kf_placeId,kf_reservationId,kf_assignmentId,kf_storageProvider,kf_storageKey,kf_originalName,kf_fileSize,kf_mimeType,kf_description,kf_createdAt)
           VALUES (?,?,?,?,?,'legacy-local',?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP))
           ON DUPLICATE KEY UPDATE kf_tripId=VALUES(kf_tripId),kf_placeId=VALUES(kf_placeId),kf_reservationId=VALUES(kf_reservationId),kf_assignmentId=VALUES(kf_assignmentId),kf_storageProvider=VALUES(kf_storageProvider),kf_storageKey=VALUES(kf_storageKey),kf_originalName=VALUES(kf_originalName),kf_fileSize=VALUES(kf_fileSize),kf_mimeType=VALUES(kf_mimeType),kf_description=VALUES(kf_description)`,
          [f.id,f.trip_id,f.place_id,f.reservation_id,f.assignment_id,f.filename,f.original_name,f.file_size,f.mime_type,f.description,f.created_at],
        );
      }
      await conn.commit();
    } catch (error) { await conn.rollback(); throw error; }

    const [r] = await conn.query('SELECT COUNT(*) AS n FROM kuktrip_files');
    console.log(JSON.stringify({ sourceMetadataRows: sourceRows.length, targetMetadataRows: Number(r[0].n), binaryBytesMoved: 0 }, null, 2));
  } finally { try { sqlite.close(); } catch {} await conn.end(); }
})().catch(err => { console.error('[kuktrip:files-copy] failed:', err?.message || err); process.exit(1); });
