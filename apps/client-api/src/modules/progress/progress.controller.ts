import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import {
    BodyMetricParam,
    MeasurementView,
    MetricDetailView,
    ProgressCardView,
    ProgressMetricParam,
    ProgressWindowQuery,
    RecordMeasurementInboundDto,
} from './dto';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    /**
     * Every card in one request. The screen shows them all at once, and six
     * round trips to paint one screen is exactly the waterfall the client is
     * built to avoid.
     */
    @Get('metrics')
    @ApiQuery({ name: 'days', required: false, example: 30 })
    @ApiOkResponse({ type: [ProgressCardView] })
    async overview(@CurrentUser() user: UserEntity, @Query() query: ProgressWindowQuery): Promise<ProgressCardView[]> {
        const cards = await this.progressService.overview(user.id, query.days);
        return cards.map(ProgressCardView.from);
    }

    /** The same card, plus what the period adds up to and how far the goal still is. */
    @Get('metrics/:metric')
    @ApiParam({ name: 'metric', example: 'weight' })
    @ApiQuery({ name: 'days', required: false, example: 30 })
    @ApiOkResponse({ type: MetricDetailView })
    async detail(
        @CurrentUser() user: UserEntity,
        @Param() params: ProgressMetricParam,
        @Query() query: ProgressWindowQuery,
    ): Promise<MetricDetailView> {
        const detail = await this.progressService.detail(user.id, params.metric, query.days);
        return MetricDetailView.from(detail);
    }

    /**
     * Only weight, waist and height accept a reading here. Calories, water and
     * steps are written through `/nutrition`, where the day they belong to is
     * part of the route — two write paths into the same number would let the
     * log and the chart disagree.
     */
    @Post('metrics/:metric/measurements')
    @HttpCode(HttpStatus.CREATED)
    @ApiParam({ name: 'metric', enum: ['weight', 'waist', 'height'] })
    @ApiCreatedResponse({ type: MeasurementView })
    async record(
        @CurrentUser() user: UserEntity,
        @Param() params: BodyMetricParam,
        @Body() body: RecordMeasurementInboundDto,
    ): Promise<MeasurementView> {
        const measurement = await this.progressService.record(user.id, params.metric, body);
        return MeasurementView.from(measurement);
    }

    @Delete('metrics/:metric/measurements/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Reading removed; the chart and the average follow.' })
    @ApiNotFoundResponse({ description: 'No such reading for this account.' })
    async remove(@CurrentUser() user: UserEntity, @Param('id') id: string): Promise<void> {
        await this.progressService.remove(user.id, id);
    }
}
