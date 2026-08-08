import { Body, Controller, HttpException, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../../types';
import { AiTripService, type TripPlanInput, type TripPlanProposal } from './ai-trip.service';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiTripController {
  constructor(private readonly ai: AiTripService) {}

  @Post('trip-plan')
  async tripPlan(@CurrentUser() _user: User, @Body() body: TripPlanInput) {
    const destination = typeof body?.destination === 'string' ? body.destination.trim() : '';
    if (!destination) throw new HttpException({ error: 'Destination is required' }, 400);

    const dayCount = body.dayCount === undefined ? undefined : Number(body.dayCount);
    if (dayCount !== undefined && (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 60)) {
      throw new HttpException({ error: 'dayCount must be between 1 and 60' }, 400);
    }

    const budget = body.budget === undefined ? undefined : Number(body.budget);
    if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) {
      throw new HttpException({ error: 'budget must be a positive number' }, 400);
    }

    return this.ai.generateTripPlan({
      destination,
      startDate: body.startDate,
      endDate: body.endDate,
      dayCount,
      travelers: body.travelers,
      budget,
      currency: body.currency?.trim() || undefined,
      interests: Array.isArray(body.interests) ? body.interests.map(String).slice(0, 20) : undefined,
      pace: body.pace,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : undefined,
    });
  }

  @Post('trip-plan/apply')
  applyTripPlan(@CurrentUser() user: User, @Body() body: { proposal?: TripPlanProposal }) {
    const proposal = body?.proposal;
    if (!proposal || typeof proposal !== 'object') {
      throw new HttpException({ error: 'proposal is required' }, 400);
    }

    const title = typeof proposal.title === 'string' ? proposal.title.trim() : '';
    if (!title || title.length > 200) {
      throw new HttpException({ error: 'proposal title must be between 1 and 200 characters' }, 400);
    }

    if (!Array.isArray(proposal.days) || proposal.days.length < 1 || proposal.days.length > 60) {
      throw new HttpException({ error: 'proposal must contain between 1 and 60 days' }, 400);
    }

    const seenDays = new Set<number>();
    let totalActivities = 0;
    for (const day of proposal.days) {
      if (!Number.isInteger(day?.dayNumber) || day.dayNumber < 1 || seenDays.has(day.dayNumber)) {
        throw new HttpException({ error: 'proposal day numbers must be unique positive integers' }, 400);
      }
      seenDays.add(day.dayNumber);
      if (typeof day.title !== 'string' || !day.title.trim() || day.title.length > 200) {
        throw new HttpException({ error: 'each proposal day requires a title up to 200 characters' }, 400);
      }
      if (!Array.isArray(day.activities) || day.activities.length > 30) {
        throw new HttpException({ error: 'each proposal day may contain at most 30 activities' }, 400);
      }
      totalActivities += day.activities.length;
      for (const activity of day.activities) {
        if (typeof activity?.name !== 'string' || !activity.name.trim() || activity.name.length > 200) {
          throw new HttpException({ error: 'each activity requires a name up to 200 characters' }, 400);
        }
        if (activity.notes != null && String(activity.notes).length > 2000) {
          throw new HttpException({ error: 'activity notes must be 2000 characters or less' }, 400);
        }
      }
    }

    if (totalActivities > 500) {
      throw new HttpException({ error: 'proposal contains too many activities' }, 400);
    }

    return this.ai.applyTripPlan(user.id, {
      ...proposal,
      title,
      currency: typeof proposal.currency === 'string' && proposal.currency.trim() ? proposal.currency.trim().slice(0, 3).toUpperCase() : 'EUR',
    });
  }
}
