import { Module } from '@nestjs/common';
import { ExploreController } from './explore.controller';
import { ExploreService } from './explore.service';
import { ExploreCommunityController } from './explore-community.controller';
import { ExploreCommunityService } from './explore-community.service';

@Module({
  controllers: [ExploreController, ExploreCommunityController],
  providers: [ExploreService, ExploreCommunityService],
})
export class ExploreModule {}
