import { Module } from '@nestjs/common';

import { AdminStatsRepositoryModule } from '@dns/database';

import { AdminStatsController } from './stats.controller';
import { AdminStatsService } from './stats.service';

@Module({
    imports: [AdminStatsRepositoryModule],
    controllers: [AdminStatsController],
    providers: [AdminStatsService],
    exports: [AdminStatsService],
})
export class StatsModule {}
