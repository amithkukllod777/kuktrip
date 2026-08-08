import { Body, Controller, Get, HttpException, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ExploreCommunityService } from './explore-community.service';
import { ExploreError } from './explore.service';

@Controller('api/explore/activities/:activityId')
@UseGuards(JwtAuthGuard)
export class ExploreCommunityController {
  constructor(private readonly community: ExploreCommunityService) {}

  private async run<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); }
    catch (error) {
      if (error instanceof ExploreError) throw new HttpException({ error: error.message }, error.status);
      throw error;
    }
  }

  @Get('private-details')
  privateDetails(@CurrentUser() user: User, @Param('activityId') activityId: string) {
    return this.run(() => this.community.privateActivityDetails(user.id, Number(activityId)));
  }

  @Get('participants')
  participants(@CurrentUser() user: User, @Param('activityId') activityId: string) {
    return this.run(async () => ({ participants: await this.community.participants(user.id, Number(activityId)) }));
  }

  @Put('participants/:sharedUserId')
  review(
    @CurrentUser() user: User,
    @Param('activityId') activityId: string,
    @Param('sharedUserId') sharedUserId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const decision = body.status === 'approved' ? 'approved' : body.status === 'rejected' ? 'rejected' : null;
    if (!decision) throw new HttpException({ error: 'status must be approved or rejected' }, 400);
    return this.run(() => this.community.reviewParticipant(user.id, Number(activityId), Number(sharedUserId), decision));
  }

  @Get('messages')
  messages(@CurrentUser() user: User, @Param('activityId') activityId: string, @Query('beforeId') beforeId?: string) {
    return this.run(async () => ({ messages: await this.community.messages(user.id, Number(activityId), beforeId ? Number(beforeId) : undefined) }));
  }

  @Post('messages')
  postMessage(@CurrentUser() user: User, @Param('activityId') activityId: string, @Body() body: Record<string, unknown>) {
    return this.run(() => this.community.postMessage(user.id, Number(activityId), String(body.body || '')));
  }
}
