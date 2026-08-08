import { Module } from '@nestjs/common';
import { AiTripController } from './ai-trip.controller';
import { AiTripService } from './ai-trip.service';

@Module({
  controllers: [AiTripController],
  providers: [AiTripService],
})
export class AiModule {}
