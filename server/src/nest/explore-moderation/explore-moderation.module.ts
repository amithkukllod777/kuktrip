import { Module } from '@nestjs/common';
import { ExploreModerationController } from './explore-moderation.controller';
import { ExploreModerationService } from './explore-moderation.service';

@Module({
  controllers: [ExploreModerationController],
  providers: [ExploreModerationService],
})
export class ExploreModerationModule {}
