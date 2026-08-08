import { Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { getSharedMysqlPool } from '../../db/sharedMysql';

@Injectable()
export class ExploreModerationService {
  async listReports(limit = 100) {
    const db = await getSharedMysqlPool();
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 250);
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT kar_id AS id, kar_activityId AS activityId, kar_reporterUserId AS reporterUserId,
              kar_reportedUserId AS reportedUserId, kar_reason AS reason, kar_details AS details,
              kar_status AS status, kar_reviewedByUserId AS reviewedByUserId,
              kar_reviewedAt AS reviewedAt, kar_createdAt AS createdAt
       FROM kuktrip_activity_reports
       ORDER BY CASE kar_status WHEN 'open' THEN 0 ELSE 1 END, kar_createdAt DESC
       LIMIT ?`,
      [safeLimit],
    );
    return rows;
  }

  async reviewReport(reportId: number, reviewerUserId: number, status: 'resolved' | 'dismissed') {
    const db = await getSharedMysqlPool();
    const [result] = await db.execute(
      `UPDATE kuktrip_activity_reports
       SET kar_status=?, kar_reviewedByUserId=?, kar_reviewedAt=CURRENT_TIMESTAMP
       WHERE kar_id=?`,
      [status, reviewerUserId, reportId],
    ) as any;
    return { updated: Number(result.affectedRows || 0) > 0 };
  }

  async setActivityModeration(activityId: number, moderationStatus: 'clear' | 'suspended' | 'removed') {
    const db = await getSharedMysqlPool();
    const status = moderationStatus === 'clear' ? 'active' : moderationStatus === 'suspended' ? 'suspended' : 'removed';
    const [result] = await db.execute(
      `UPDATE kuktrip_activities SET kac_moderationStatus=?, kac_status=? WHERE kac_id=?`,
      [moderationStatus, status, activityId],
    ) as any;
    return { updated: Number(result.affectedRows || 0) > 0 };
  }
}
