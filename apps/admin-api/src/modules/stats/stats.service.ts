import { Injectable } from '@nestjs/common';

import { AdminStatsRepository, FavoriteRecipeStats, OverviewStats } from '@dns/database';
import { AdminFavoriteStatsQuery, AdminOverviewQuery } from '@dns/validation';

@Injectable()
export class AdminStatsService {
    constructor(private readonly statsRepository: AdminStatsRepository) {}

    overview(query: AdminOverviewQuery): Promise<OverviewStats> {
        return this.statsRepository.overview(query.days);
    }

    favorites(query: AdminFavoriteStatsQuery): Promise<{ items: FavoriteRecipeStats[]; total: number }> {
        return this.statsRepository.favorites({
            language: query.language,
            page: query.page,
            limit: query.limit,
        });
    }
}
