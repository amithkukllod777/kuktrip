import { Module } from '@nestjs/common';
import { AiTripController } from './ai-trip.controller';
import { AiTripService } from './ai-trip.service';
import { AiCopilotController } from './ai-copilot.controller';
import { AiCopilotService } from './ai-copilot.service';

@Module({
  controllers: [AiTripController, AiCopilotController],
  providers: [AiTripService, AiCopilotService],
})
export class AiModule {}
