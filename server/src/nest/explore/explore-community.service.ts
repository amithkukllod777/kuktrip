import { Injectable } from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getSharedMysqlPool, withSharedMysqlTransaction } from '../../db/sharedMysql';
import { ExploreError } from './explore.service';

@Injectable()
export class ExploreCommunityService {
  private async sharedUserId(localUserId: number): Promise<number> {
    const db = await getSharedMysqlPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT kim_sharedUserId AS id FROM kuktrip_identity_migration_map WHERE kim_localUserId=? LIMIT 1',
      [localUserId],
    );
    if (!rows.length) throw new ExploreError('Kuklabs identity migration is not complete for this account', 409);
    return Number(rows[0].id);
  }

  private async membership(activityId: number, sharedUserId: number) {
    const db = await getSharedMysqlPool();
    const [activity] = await db.execute<RowDataPacket[]>(
      `SELECT kac_id AS id, kac_hostUserId AS hostUserId, kac_capacity AS capacity,
              kac_status AS status, kac_moderationStatus AS moderationStatus,
              kac_meetingLabel AS meetingLabel, kac_meetingLat AS meetingLat, kac_meetingLng AS meetingLng
         FROM kuktrip_activities WHERE kac_id=? LIMIT 1`,
      [activityId],
    );
    if (!activity.length || activity[0].status !== 'active' || activity[0].moderationStatus !== 'clear') {
      throw new ExploreError('Activity not found', 404);
    }
    const isHost = Number(activity[0].hostUserId) === sharedUserId;
    const [participant] = await db.execute<RowDataPacket[]>(
      `SELECT kap_role AS role, kap_status AS status
         FROM kuktrip_activity_participants WHERE kap_activityId=? AND kap_userId=? LIMIT 1`,
      [activityId, sharedUserId],
    );
    return { activity: activity[0], isHost, participant: participant[0] || null };
  }

  async privateActivityDetails(localUserId: number, activityId: number) {
    const me = await this.sharedUserId(localUserId);
    const access = await this.membership(activityId, me);
    const approved = access.isHost || access.participant?.status === 'approved';
    if (!approved) throw new ExploreError('Join approval is required before private activity details are available', 403);
    return {
      id: Number(access.activity.id),
      meetingLabel: access.activity.meetingLabel ?? null,
      meetingLat: access.activity.meetingLat == null ? null : Number(access.activity.meetingLat),
      meetingLng: access.activity.meetingLng == null ? null : Number(access.activity.meetingLng),
    };
  }

  async participants(localUserId: number, activityId: number) {
    const me = await this.sharedUserId(localUserId);
    const access = await this.membership(activityId, me);
    if (!access.isHost) throw new ExploreError('Only the activity host can manage participants', 403);
    const db = await getSharedMysqlPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT kap_userId AS userId, kap_role AS role, kap_status AS status,
              kap_joinedAt AS joinedAt, kap_createdAt AS requestedAt
         FROM kuktrip_activity_participants
        WHERE kap_activityId=?
        ORDER BY FIELD(kap_status,'pending','approved','rejected'), kap_createdAt ASC`,
      [activityId],
    );
    return rows;
  }

  async reviewParticipant(localUserId: number, activityId: number, participantUserId: number, decision: 'approved' | 'rejected') {
    const me = await this.sharedUserId(localUserId);
    if (!Number.isInteger(participantUserId) || participantUserId <= 0) throw new ExploreError('Invalid participant');
    return withSharedMysqlTransaction(async conn => {
      const [activity] = await conn.execute<RowDataPacket[]>(
        `SELECT kac_hostUserId AS hostUserId, kac_capacity AS capacity, kac_status AS status
           FROM kuktrip_activities WHERE kac_id=? FOR UPDATE`,
        [activityId],
      );
      if (!activity.length || activity[0].status !== 'active') throw new ExploreError('Activity not found', 404);
      if (Number(activity[0].hostUserId) !== me) throw new ExploreError('Only the activity host can manage participants', 403);
      if (participantUserId === me) throw new ExploreError('The host membership cannot be changed');

      const [target] = await conn.execute<RowDataPacket[]>(
        `SELECT kap_id AS id FROM kuktrip_activity_participants WHERE kap_activityId=? AND kap_userId=? FOR UPDATE`,
        [activityId, participantUserId],
      );
      if (!target.length) throw new ExploreError('Join request not found', 404);

      if (decision === 'approved' && activity[0].capacity != null) {
        const [count] = await conn.execute<RowDataPacket[]>(
          `SELECT COUNT(*) AS total FROM kuktrip_activity_participants WHERE kap_activityId=? AND kap_status='approved'`,
          [activityId],
        );
        if (Number(count[0].total) >= Number(activity[0].capacity)) throw new ExploreError('Activity is full', 409);
      }

      await conn.execute(
        `UPDATE kuktrip_activity_participants
            SET kap_status=?, kap_joinedAt=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END
          WHERE kap_activityId=? AND kap_userId=?`,
        [decision, decision, activityId, participantUserId],
      );
      return { status: decision };
    });
  }

  private async assertChatAccess(activityId: number, sharedUserId: number) {
    const access = await this.membership(activityId, sharedUserId);
    if (!access.isHost && access.participant?.status !== 'approved') {
      throw new ExploreError('Only approved participants can use activity chat', 403);
    }
    const db = await getSharedMysqlPool();
    const [blocked] = await db.execute<RowDataPacket[]>(
      `SELECT 1
         FROM kuktrip_activity_participants p
         JOIN kuktrip_user_blocks b
           ON ((b.kub_blockerUserId=? AND b.kub_blockedUserId=p.kap_userId)
            OR (b.kub_blockedUserId=? AND b.kub_blockerUserId=p.kap_userId))
        WHERE p.kap_activityId=? AND p.kap_status='approved' LIMIT 1`,
      [sharedUserId, sharedUserId, activityId],
    );
    if (blocked.length) throw new ExploreError('Activity chat is unavailable because of a block relationship', 403);
  }

  async messages(localUserId: number, activityId: number, beforeId?: number) {
    const me = await this.sharedUserId(localUserId);
    await this.assertChatAccess(activityId, me);
    const db = await getSharedMysqlPool();
    const params: unknown[] = [activityId];
    let before = '';
    if (beforeId && Number.isInteger(beforeId)) { before = ' AND kam_id < ?'; params.push(beforeId); }
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT kam_id AS id, kam_senderUserId AS senderUserId, kam_body AS body, kam_createdAt AS createdAt
         FROM kuktrip_activity_messages
        WHERE kam_activityId=? AND kam_status='visible'${before}
        ORDER BY kam_id DESC LIMIT 100`,
      params,
    );
    return rows.reverse();
  }

  async postMessage(localUserId: number, activityId: number, body: string) {
    const me = await this.sharedUserId(localUserId);
    await this.assertChatAccess(activityId, me);
    const text = String(body || '').trim();
    if (!text || text.length > 2000) throw new ExploreError('Message must be between 1 and 2000 characters');
    const db = await getSharedMysqlPool();
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO kuktrip_activity_messages (kam_activityId,kam_senderUserId,kam_body) VALUES (?,?,?)`,
      [activityId, me, text],
    );
    return { id: Number(result.insertId), senderUserId: me, body: text };
  }
}
