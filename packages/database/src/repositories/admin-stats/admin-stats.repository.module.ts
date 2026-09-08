import { Module } from '@nestjs/common';

import { AdminStatsRepository } from './admin-stats.repository';

@Module({
    providers: [AdminStatsRepository],
    exports: [AdminStatsRepository],
})
export class AdminStatsRepositoryModule {}
