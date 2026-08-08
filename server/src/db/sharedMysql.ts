import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

/**
 * Shared Kuklabs MySQL boundary.
 *
 * This module is deliberately opt-in. The existing SQLite runtime remains the
 * production source of truth until the migration verification gates pass.
 * Product repositories can be moved behind this boundary one domain at a time.
 */
export type KukTripPersistenceMode = 'sqlite' | 'mysql-shadow' | 'mysql';

export function getPersistenceMode(): KukTripPersistenceMode {
  const raw = (process.env.KUKTRIP_PERSISTENCE_MODE || 'sqlite').toLowerCase();
  if (raw === 'mysql-shadow' || raw === 'mysql') return raw;
  return 'sqlite';
}

export function isSharedMysqlEnabled(): boolean {
  return getPersistenceMode() !== 'sqlite';
}

let pool: Pool | null = null;

async function mysqlModule() {
  // Keep mysql2 out of the default SQLite startup path. The dependency is only
  // required when an operator explicitly enables a MySQL migration mode.
  return import('mysql2/promise');
}

export async function getSharedMysqlPool(): Promise<Pool> {
  if (!isSharedMysqlEnabled()) {
    throw new Error('Shared MySQL requested while KUKTRIP_PERSISTENCE_MODE=sqlite');
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required for shared MySQL mode');

  if (!pool) {
    const mysql = await mysqlModule();
    pool = mysql.createPool({
      uri: url,
      connectionLimit: Number(process.env.KUKTRIP_MYSQL_POOL_SIZE || 8),
      waitForConnections: true,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

export async function verifySharedMysqlContract(): Promise<void> {
  const db = await getSharedMysqlPool();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME IN ('id', 'openId')`,
  );
  const names = new Set(rows.map(row => String(row.COLUMN_NAME)));
  if (!names.has('id') || !names.has('openId')) {
    throw new Error('Target DATABASE_URL is not the canonical Kuklabs database: users(id, openId) missing');
  }
}

export async function withSharedMysqlTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const db = await getSharedMysqlPool();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeSharedMysql(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = null;
}
