import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';

import { FavoriteRecipeView, FavoriteStatsQueryDto, OverviewQueryDto, OverviewView } from './dto';
import { AdminStatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
@ApiBearerAuth()
export class AdminStatsController {
    constructor(private readonly statsService: AdminStatsService) {}

    /**
     * The whole home screen in one response.
     *
     * Five endpoints would draw it in pieces and give five loading states
     * where there is really one.
     */
    @Get('overview')
    @ApiOkResponse({ type: OverviewView })
    @ApiBadRequestResponse({ description: 'The period must be one of 7, 30 or 90 days.' })
    async overview(@Query() query: OverviewQueryDto): Promise<OverviewView> {
        return OverviewView.from(await this.statsService.overview(query));
    }

    @Get('favorites')
    @ApiOkResponse({ type: FavoriteRecipeView, isArray: true })
    async favorites(@Query() query: FavoriteStatsQueryDto): Promise<Paginated<FavoriteRecipeView>> {
        const result = await this.statsService.favorites(query);
        return Paginated.of(result.items.map(FavoriteRecipeView.from), result.total, query.page, query.limit);
    }
}
