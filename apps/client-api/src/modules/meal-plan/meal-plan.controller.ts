import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
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

import { AddPlanItemInboundDto, CopyPlanDayInboundDto, MealPlanRangeQuery, PlanDateParam, PlanDayView } from './dto';
import { MealPlanService } from './meal-plan.service';

@ApiTags('meal-plan')
@Controller('meal-plan')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class MealPlanController {
    constructor(private readonly mealPlanService: MealPlanService) {}

    /**
     * The window the week strip shows, dishes included.
     *
     * A date range rather than a week number: where a week starts is the
     * client's business, and the server would otherwise have to guess a
     * locale's first weekday and be wrong for somebody.
     */
    @Get()
    @ApiQuery({ name: 'from', example: '2026-05-18' })
    @ApiQuery({ name: 'to', example: '2026-05-24' })
    @ApiOkResponse({ type: [PlanDayView], description: 'Every day in the window, empty ones included.' })
    async range(@CurrentUser() user: UserEntity, @Query() query: MealPlanRangeQuery): Promise<PlanDayView[]> {
        const days = await this.mealPlanService.range(user.id, query);
        return days.map(PlanDayView.from);
    }

    /**
     * Answers with the whole day rather than the created item: the day's
     * totals and its verdict against the goal are server-computed, so the
     * client cannot recalculate them without carrying the tolerance itself.
     */
    @Post('days/:date/items')
    @ApiParam({ name: 'date', example: '2026-05-18' })
    @ApiCreatedResponse({ type: PlanDayView })
    @ApiNotFoundResponse({ description: 'No such dish for this account.' })
    async addItem(
        @CurrentUser() user: UserEntity,
        @Param() params: PlanDateParam,
        @Body() body: AddPlanItemInboundDto,
    ): Promise<PlanDayView> {
        const day = await this.mealPlanService.addItem(user.id, params.date, body);
        return PlanDayView.from(day);
    }

    @Delete('days/:date/items/:itemId')
    @ApiParam({ name: 'date', example: '2026-05-18' })
    @ApiParam({ name: 'itemId', format: 'uuid' })
    @ApiOkResponse({ type: PlanDayView, description: 'The day as it now stands, totals recalculated.' })
    @ApiNotFoundResponse({ description: 'No such planned dish for this account.' })
    async removeItem(
        @CurrentUser() user: UserEntity,
        @Param() params: PlanDateParam,
        @Param('itemId') itemId: string,
    ): Promise<PlanDayView> {
        const day = await this.mealPlanService.removeItem(user.id, params.date, itemId);
        return PlanDayView.from(day);
    }

    @Delete('days/:date')
    @ApiParam({ name: 'date', example: '2026-05-18' })
    @ApiOkResponse({ type: PlanDayView, description: 'The emptied day.' })
    async clearDay(@CurrentUser() user: UserEntity, @Param() params: PlanDateParam): Promise<PlanDayView> {
        const day = await this.mealPlanService.clearDay(user.id, params.date);
        return PlanDayView.from(day);
    }

    /**
     * Copies this day onto the chosen ones, replacing whatever they held.
     *
     * A verb in the path, which ADR-0004 otherwise forbids: this is not a
     * state change on one resource but an operation across several, and
     * `PUT /meal-plan/days/{target}` repeated N times would be N chances to
     * half-finish.
     */
    @Post('days/:date/copy')
    @ApiParam({ name: 'date', example: '2026-05-18' })
    @ApiOkResponse({ type: [PlanDayView], description: 'The days as they now stand.' })
    @ApiBadRequestResponse({ description: 'Nothing to copy, or the source is among the targets.' })
    async copyDay(
        @CurrentUser() user: UserEntity,
        @Param() params: PlanDateParam,
        @Body() body: CopyPlanDayInboundDto,
    ): Promise<PlanDayView[]> {
        const days = await this.mealPlanService.copyDay(user.id, params.date, body);
        return days.map(PlanDayView.from);
    }
}
