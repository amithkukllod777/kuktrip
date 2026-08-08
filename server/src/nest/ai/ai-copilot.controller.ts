import { Body, Controller, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import type { User } from '../../types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiCopilotService } from './ai-copilot.service';

@Controller('api/ai/trips')
@UseGuards(JwtAuthGuard)
export class AiCopilotController {
  constructor(private readonly copilot: AiCopilotService) {}

  @Post(':tripId/copilot')
  suggest(
    @CurrentUser() user: User,
    @Param('tripId') tripIdRaw: string,
    @Body() body: { request?: string; context?: Record<string, unknown> },
  ) {
    const tripId = Number(tripIdRaw);
    if (!Number.isInteger(tripId) || tripId <= 0) throw new HttpException({ error: 'Invalid trip ID' }, 400);
    const request = typeof body?.request === 'string' ? body.request.trim() : '';
    if (!request || request.length > 2000) throw new HttpException({ error: 'request must be between 1 and 2000 characters' }, 400);
    const context = body?.context && typeof body.context === 'object' && !Array.isArray(body.context) ? body.context : undefined;
    return this.copilot.suggest(user.id, tripId, request, context);
  }
}
