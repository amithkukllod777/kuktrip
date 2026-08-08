import type { RowDataPacket } from 'mysql2/promise';
import { getSharedMysqlPool } from '../db/sharedMysql';

export type MysqlTripRow = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  currency: string;
  cover_image: string | null;
  is_archived: number;
  reminder_days: number;
  day_count: number;
  place_count: number;
  is_owner: number;
  owner_username: string | null;
  shared_count: number;
};

async function resolveSharedUserId(localUserId: number): Promise<number | null> {
  const db = await getSharedMysqlPool();
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT kim_sharedUserId AS sharedUserId
       FROM kuktrip_identity_migration_map
      WHERE kim_localUserId = ?
      LIMIT 1`,
    [localUserId],
  );
  if (!rows.length) return null;
  return Number(rows[0].sharedUserId);
}

function dateValue(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function mapTrip(row: RowDataPacket): MysqlTripRow {
  return {
    id: Number(row.id),
    user_id: Number(row.user_id),
    title: String(row.title),
    description: row.description == null ? null : String(row.description),
    start_date: dateValue(row.start_date),
    end_date: dateValue(row.end_date),
    currency: String(row.currency || 'EUR'),
    cover_image: row.cover_image == null ? null : String(row.cover_image),
    is_archived: Number(row.is_archived || 0),
    reminder_days: Number(row.reminder_days ?? 3),
    day_count: Number(row.day_count || 0),
    place_count: Number(row.place_count || 0),
    is_owner: Number(row.is_owner || 0),
    owner_username: row.owner_username == null ? null : String(row.owner_username),
    shared_count: Number(row.shared_count || 0),
  };
}

const tripProjection = `
  SELECT
    t.kt_id AS id,
    t.kt_ownerUserId AS user_id,
    t.kt_title AS title,
    t.kt_description AS description,
    t.kt_startDate AS start_date,
    t.kt_endDate AS end_date,
    t.kt_currency AS currency,
    t.kt_coverImage AS cover_image,
    t.kt_isArchived AS is_archived,
    t.kt_reminderDays AS reminder_days,
    (SELECT COUNT(*) FROM kuktrip_days d WHERE d.kd_tripId = t.kt_id) AS day_count,
    (SELECT COUNT(*) FROM kuktrip_places p WHERE p.kp_tripId = t.kt_id) AS place_count,
    CASE WHEN t.kt_ownerUserId = ? THEN 1 ELSE 0 END AS is_owner,
    u.name AS owner_username,
    (SELECT COUNT(*) FROM kuktrip_trip_members cm WHERE cm.ktm_tripId = t.kt_id) AS shared_count
  FROM kuktrip_trips t
  JOIN users u ON u.id = t.kt_ownerUserId
  LEFT JOIN kuktrip_trip_members m ON m.ktm_tripId = t.kt_id AND m.ktm_userId = ?
`;

export async function listTripsFromSharedMysql(localUserId: number, archived: number | null): Promise<MysqlTripRow[] | null> {
  const sharedUserId = await resolveSharedUserId(localUserId);
  if (sharedUserId == null) return null;
  const db = await getSharedMysqlPool();

  const params: unknown[] = [sharedUserId, sharedUserId, sharedUserId];
  let where = `(t.kt_ownerUserId = ? OR m.ktm_userId IS NOT NULL)`;
  if (archived !== null) {
    where += ` AND t.kt_isArchived = ?`;
    params.push(archived);
  }

  const [rows] = await db.query<RowDataPacket[]>(
    `${tripProjection} WHERE ${where} ORDER BY t.kt_createdAt DESC`,
    params,
  );
  return rows.map(mapTrip);
}

export async function getTripFromSharedMysql(localUserId: number, tripId: string | number): Promise<MysqlTripRow | null | undefined> {
  const sharedUserId = await resolveSharedUserId(localUserId);
  if (sharedUserId == null) return undefined;
  const db = await getSharedMysqlPool();
  const [rows] = await db.query<RowDataPacket[]>(
    `${tripProjection}
      WHERE t.kt_id = ? AND (t.kt_ownerUserId = ? OR m.ktm_userId IS NOT NULL)
      LIMIT 1`,
    [sharedUserId, sharedUserId, tripId, sharedUserId],
  );
  if (!rows.length) return null;
  return mapTrip(rows[0]);
}
