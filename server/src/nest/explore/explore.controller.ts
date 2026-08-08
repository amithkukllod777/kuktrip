import { Body, Controller, Get, HttpException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ExploreError, ExploreService } from './explore.service';

@Controller('api/explore')
@UseGuards(JwtAuthGuard)
export class ExploreController {
  constructor(private readonly explore: ExploreService) {}

  private async run<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); }
    catch (error) {
      if (error instanceof ExploreError) throw new HttpException({ error: error.message }, error.status);
      throw error;
    }
  }

  @Get('activities')
  list(
    @CurrentUser() user: User,
    @Query('destination') destination?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.run(async () => ({ activities: await this.explore.listActivities(user.id, { destination, from, to, limit: Number(limit) || undefined }) }));
  }

  @Post('activities')
  create(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.run(() => this.explore.createActivity(user.id, {
      title: String(body.title || ''),
      category: String(body.category || ''),
      description: body.description == null ? null : String(body.description),
      destination: body.destination == null ? null : String(body.destination),
      area: body.area == null ? null : String(body.area),
      startAt: String(body.startAt || body.start_at || ''),
      endAt: body.endAt == null && body.end_at == null ? null : String(body.endAt || body.end_at),
      timezone: body.timezone == null ? null : String(body.timezone),
      capacity: body.capacity == null ? null : Number(body.capacity),
      visibility: body.visibility as 'public' | 'private' | 'invite_only' | undefined,
      joinMode: (body.joinMode || body.join_mode) as 'open' | 'approval' | 'invite_only' | undefined,
      tripId: body.tripId == null && body.trip_id == null ? null : Number(body.tripId || body.trip_id),
      publicLat: body.publicLat == null ? null : Number(body.publicLat),
      publicLng: body.publicLng == null ? null : Number(body.publicLng),
      meetingLabel: body.meetingLabel == null ? null : String(body.meetingLabel),
      meetingLat: body.meetingLat == null ? null : Number(body.meetingLat),
      meetingLng: body.meetingLng == null ? null : Number(body.meetingLng),
    }));
  }

  @Post('activities/:id/join')
  join(@CurrentUser() user: User, @Param('id') id: string) {
    return this.run(() => this.explore.joinActivity(user.id, Number(id)));
  }

  @Put('discovery')
  discovery(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.run(() => this.explore.updateDiscovery(user.id, {
      enabled: body.enabled === true,
      showUpcomingDestinations: body.showUpcomingDestinations === true,
      interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
    }));
  }

  @Post('blocks/:sharedUserId')
  block(@CurrentUser() user: User, @Param('sharedUserId') sharedUserId: string) {
    return this.run(() => this.explore.blockUser(user.id, Number(sharedUserId)));
  }

  @Post('reports')
  report(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.run(() => this.explore.report(user.id, {
      activityId: body.activityId == null ? undefined : Number(body.activityId),
      reportedUserId: body.reportedUserId == null ? undefined : Number(body.reportedUserId),
      reason: String(body.reason || ''),
      details: body.details == null ? undefined : String(body.details),
    }));
  }
}
