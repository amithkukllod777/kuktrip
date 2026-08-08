import { Body, Controller, HttpException, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { User } from '../../types';
import { AiTripService, type TripPlanInput } from './ai-trip.service';

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
}
