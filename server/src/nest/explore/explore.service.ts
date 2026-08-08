import { Injectable } from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getSharedMysqlPool, withSharedMysqlTransaction } from '../../db/sharedMysql';

export class ExploreError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

type CreateActivityInput = {
  title: string;
  category: string;
  description?: string | null;
  destination?: string | null;
  area?: string | null;
  startAt: string;
  endAt?: string | null;
  timezone?: string | null;
  capacity?: number | null;
  visibility?: 'public' | 'private' | 'invite_only';
  joinMode?: 'open' | 'approval' | 'invite_only';
  tripId?: number | null;
  publicLat?: number | null;
  publicLng?: number | null;
  meetingLabel?: string | null;
  meetingLat?: number | null;
  meetingLng?: number | null;
};

@Injectable()
export class ExploreService {
  private async sharedIdentity(localUserId: number, requireAdultGate = false): Promise<{ id: number; adultGate: boolean }> {
    const db = await getSharedMysqlPool();
    const [map] = await db.execute<RowDataPacket[]>(
      'SELECT kim_sharedUserId AS id FROM kuktrip_identity_migration_map WHERE kim_localUserId = ? LIMIT 1',
      [localUserId],
    );
    if (!map.length) throw new ExploreError('Kuklabs identity migration is not complete for this account', 409);
    const sharedId = Number(map[0].id);
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT id, terms_accepted_at AS termsAcceptedAt FROM users WHERE id = ? LIMIT 1',
      [sharedId],
    );
    if (!users.length) throw new ExploreError('Kuklabs account not found', 401);
    const adultGate = Boolean(users[0].termsAcceptedAt);
    if (requireAdultGate && !adultGate) {
      throw new ExploreError('Public social discovery requires the Kuklabs 18+ legal gate', 403);
    }
    return { id: sharedId, adultGate };
  }

  async listActivities(localUserId: number, query: { destination?: string; from?: string; to?: string; limit?: number }) {
    const me = await this.sharedIdentity(localUserId);
    const db = await getSharedMysqlPool();
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const where = ["a.kac_status = 'active'", "a.kac_moderationStatus = 'clear'", "a.kac_visibility = 'public'"];
    const params: unknown[] = [];
    if (query.destination?.trim()) { where.push('LOWER(a.kac_destination) = LOWER(?)'); params.push(query.destination.trim()); }
    if (query.from) { where.push('a.kac_startAt >= ?'); params.push(query.from); }
    if (query.to) { where.push('a.kac_startAt <= ?'); params.push(query.to); }
    params.push(me.id, me.id, me.id, limit);

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT a.kac_id AS id, a.kac_hostUserId AS hostUserId, a.kac_title AS title,
              a.kac_category AS category, a.kac_description AS description,
              a.kac_destination AS destination, a.kac_area AS area,
              a.kac_startAt AS startAt, a.kac_endAt AS endAt, a.kac_timezone AS timezone,
              a.kac_capacity AS capacity, a.kac_joinMode AS joinMode,
              a.kac_publicLat AS lat, a.kac_publicLng AS lng,
              COUNT(CASE WHEN p.kap_status = 'approved' THEN 1 END) AS participantCount,
              MAX(CASE WHEN p.kap_userId = ? THEN p.kap_status END) AS myStatus
       FROM kuktrip_activities a
       LEFT JOIN kuktrip_activity_participants p ON p.kap_activityId = a.kac_id
       WHERE ${where.join(' AND ')}
         AND NOT EXISTS (
           SELECT 1 FROM kuktrip_user_blocks b
           WHERE (b.kub_blockerUserId = ? AND b.kub_blockedUserId = a.kac_hostUserId)
              OR (b.kub_blockerUserId = a.kac_hostUserId AND b.kub_blockedUserId = ?)
         )
       GROUP BY a.kac_id
       ORDER BY a.kac_startAt ASC
       LIMIT ?`,
      params,
    );
    return rows;
  }

  async createActivity(localUserId: number, input: CreateActivityInput) {
    const me = await this.sharedIdentity(localUserId, true);
    const title = String(input.title || '').trim();
    const category = String(input.category || '').trim().toLowerCase();
    if (!title || title.length > 200) throw new ExploreError('Activity title is required and must be at most 200 characters');
    if (!category || category.length > 64) throw new ExploreError('Activity category is required');
    if (!input.startAt || Number.isNaN(Date.parse(input.startAt))) throw new ExploreError('Valid startAt is required');
    const capacity = input.capacity == null ? null : Math.min(Math.max(Number(input.capacity), 2), 500);
    const visibility = input.visibility || 'public';
    const joinMode = input.joinMode || 'approval';
    if (visibility === 'public' && joinMode === 'invite_only') throw new ExploreError('Public activities cannot be invite-only');

    const db = await getSharedMysqlPool();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO kuktrip_activities
       (kac_tripId, kac_hostUserId, kac_title, kac_category, kac_description, kac_destination, kac_area,
        kac_startAt, kac_endAt, kac_timezone, kac_capacity, kac_visibility, kac_joinMode, kac_agePolicy,
        kac_locationPrivacy, kac_publicLat, kac_publicLng, kac_meetingLabel, kac_meetingLat, kac_meetingLng)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'adults_only', 'approximate_until_joined', ?, ?, ?, ?, ?)`,
      [input.tripId ?? null, me.id, title, category, input.description ?? null, input.destination ?? null, input.area ?? null,
       input.startAt, input.endAt ?? null, input.timezone ?? null, capacity, visibility, joinMode,
       input.publicLat ?? null, input.publicLng ?? null, input.meetingLabel ?? null, input.meetingLat ?? null, input.meetingLng ?? null],
    );
    const activityId = Number(result.insertId);
    await db.execute(
      `INSERT INTO kuktrip_activity_participants
       (kap_activityId, kap_userId, kap_role, kap_status, kap_joinedAt)
       VALUES (?, ?, 'host', 'approved', CURRENT_TIMESTAMP)`,
      [activityId, me.id],
    );
    return { id: activityId };
  }

  async joinActivity(localUserId: number, activityId: number) {
    const me = await this.sharedIdentity(localUserId, true);
    return withSharedMysqlTransaction(async conn => {
      const [rows] = await conn.execute<RowDataPacket[]>(
        `SELECT kac_id AS id, kac_hostUserId AS hostUserId, kac_capacity AS capacity,
                kac_joinMode AS joinMode, kac_status AS status, kac_moderationStatus AS moderationStatus
         FROM kuktrip_activities WHERE kac_id = ? FOR UPDATE`,
        [activityId],
      );
      if (!rows.length || rows[0].status !== 'active' || rows[0].moderationStatus !== 'clear') throw new ExploreError('Activity not found', 404);
      if (Number(rows[0].hostUserId) === me.id) return { status: 'approved', alreadyHost: true };

      const [blocked] = await conn.execute<RowDataPacket[]>(
        `SELECT kub_id FROM kuktrip_user_blocks
         WHERE (kub_blockerUserId=? AND kub_blockedUserId=?) OR (kub_blockerUserId=? AND kub_blockedUserId=?) LIMIT 1`,
        [me.id, rows[0].hostUserId, rows[0].hostUserId, me.id],
      );
      if (blocked.length) throw new ExploreError('Activity unavailable', 404);

      const [count] = await conn.execute<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM kuktrip_activity_participants WHERE kap_activityId=? AND kap_status='approved'`,
        [activityId],
      );
      const capacity = rows[0].capacity == null ? null : Number(rows[0].capacity);
      if (capacity != null && Number(count[0].total) >= capacity) throw new ExploreError('Activity is full', 409);

      const status = rows[0].joinMode === 'open' ? 'approved' : 'pending';
      await conn.execute(
        `INSERT INTO kuktrip_activity_participants (kap_activityId, kap_userId, kap_role, kap_status, kap_joinedAt)
         VALUES (?, ?, 'participant', ?, CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END)
         ON DUPLICATE KEY UPDATE kap_status=VALUES(kap_status), kap_joinedAt=VALUES(kap_joinedAt)`,
        [activityId, me.id, status, status],
      );
      return { status };
    });
  }

  async updateDiscovery(localUserId: number, input: { enabled: boolean; showUpcomingDestinations?: boolean; interests?: string[] }) {
    const me = await this.sharedIdentity(localUserId, Boolean(input.enabled));
    const db = await getSharedMysqlPool();
    const interests = JSON.stringify((input.interests || []).slice(0, 30).map(String));
    await db.execute(
      `INSERT INTO kuktrip_traveler_discovery_preferences
       (ktdp_userId, ktdp_discoveryEnabled, ktdp_showUpcomingDestinations, ktdp_visibility, ktdp_interests)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ktdp_discoveryEnabled=VALUES(ktdp_discoveryEnabled),
         ktdp_showUpcomingDestinations=VALUES(ktdp_showUpcomingDestinations),
         ktdp_visibility=VALUES(ktdp_visibility), ktdp_interests=VALUES(ktdp_interests)`,
      [me.id, input.enabled ? 1 : 0, input.showUpcomingDestinations ? 1 : 0, input.enabled ? 'discoverable' : 'private', interests],
    );
    return { enabled: Boolean(input.enabled) };
  }

  async blockUser(localUserId: number, blockedSharedUserId: number) {
    const me = await this.sharedIdentity(localUserId);
    if (!Number.isInteger(blockedSharedUserId) || blockedSharedUserId <= 0 || blockedSharedUserId === me.id) throw new ExploreError('Invalid user');
    const db = await getSharedMysqlPool();
    await db.execute(
      `INSERT IGNORE INTO kuktrip_user_blocks (kub_blockerUserId, kub_blockedUserId) VALUES (?, ?)`,
      [me.id, blockedSharedUserId],
    );
    return { blocked: true };
  }

  async report(localUserId: number, input: { activityId?: number; reportedUserId?: number; reason: string; details?: string }) {
    const me = await this.sharedIdentity(localUserId);
    const reason = String(input.reason || '').trim();
    if (!reason || reason.length > 64) throw new ExploreError('Report reason is required');
    const details = String(input.details || '').trim().slice(0, 2000) || null;
    const db = await getSharedMysqlPool();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO kuktrip_activity_reports (kar_activityId, kar_reporterUserId, kar_reportedUserId, kar_reason, kar_details)
       VALUES (?, ?, ?, ?, ?)`,
      [input.activityId ?? null, me.id, input.reportedUserId ?? null, reason, details],
    );
    return { reportId: Number(result.insertId) };
  }
}
