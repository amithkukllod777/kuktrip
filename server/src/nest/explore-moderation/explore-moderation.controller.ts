import { Body, Controller, Get, HttpException, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExploreModerationService } from './explore-moderation.service';

@Controller('api/admin/explore')
@UseGuards(JwtAuthGuard)
export class ExploreModerationController {
  constructor(private readonly moderation: ExploreModerationService) {}

  private requireAdmin(user: User) {
    if (user.role !== 'admin') throw new HttpException({ error: 'Admin access required' }, 403);
  }

  @Get('reports')
  async reports(@CurrentUser() user: User, @Query('limit') limit?: string) {
    this.requireAdmin(user);
    return { reports: await this.moderation.listReports(Number(limit) || 100) };
  }

  @Post('reports/:id/review')
  async review(
    @CurrentUser() user: User,
    @Param('id') idRaw: string,
    @Body() body: { status?: 'resolved' | 'dismissed' },
  ) {
    this.requireAdmin(user);
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) throw new HttpException({ error: 'Invalid report ID' }, 400);
    if (body.status !== 'resolved' && body.status !== 'dismissed') throw new HttpException({ error: 'status must be resolved or dismissed' }, 400);
    const result = await this.moderation.reviewReport(id, user.id, body.status);
    if (!result.updated) throw new HttpException({ error: 'Report not found' }, 404);
    return result;
  }

  @Post('activities/:id/moderation')
  async activityModeration(
    @CurrentUser() user: User,
    @Param('id') idRaw: string,
    @Body() body: { status?: 'clear' | 'suspended' | 'removed' },
  ) {
    this.requireAdmin(user);
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) throw new HttpException({ error: 'Invalid activity ID' }, 400);
    if (!['clear','suspended','removed'].includes(String(body.status))) throw new HttpException({ error: 'Invalid moderation status' }, 400);
    const result = await this.moderation.setActivityModeration(id, body.status as 'clear' | 'suspended' | 'removed');
    if (!result.updated) throw new HttpException({ error: 'Activity not found' }, 404);
    return result;
  }
}
