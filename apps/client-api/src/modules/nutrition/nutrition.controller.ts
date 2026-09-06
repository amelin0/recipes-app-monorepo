import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import {
    DailySliceView,
    LogMealInboundDto,
    LogWaterInboundDto,
    MealLogEntryView,
    NutritionGoalView,
    SetStepsInboundDto,
    UpsertNutritionGoalInboundDto,
} from './dto';
import { LogDateParam } from './dto/inbound/log-date.param';
import { NutritionService } from './nutrition.service';

@ApiTags('nutrition')
@Controller('nutrition')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class NutritionController {
    constructor(private readonly nutritionService: NutritionService) {}

    @Get('goal')
    @ApiOkResponse({ type: NutritionGoalView, description: 'Null body when no goal has been set yet.' })
    async getGoal(@CurrentUser() user: UserEntity): Promise<NutritionGoalView | null> {
        const goal = await this.nutritionService.getGoal(user.id);
        return goal ? NutritionGoalView.from(goal) : null;
    }

    /** `PUT` because there is exactly one goal and the screen saves it whole. */
    @Put('goal')
    @ApiOkResponse({ type: NutritionGoalView })
    async upsertGoal(
        @CurrentUser() user: UserEntity,
        @Body() body: UpsertNutritionGoalInboundDto,
    ): Promise<NutritionGoalView> {
        return NutritionGoalView.from(await this.nutritionService.upsertGoal(user.id, body));
    }

    /**
     * The date is the user's own calendar day, supplied by the device: a meal
     * at 01:00 belongs to the night before for the person eating it, and only
     * the client knows which day that was.
     */
    @Get('days/:date')
    @ApiParam({ name: 'date', example: '2026-09-06' })
    @ApiOkResponse({ type: DailySliceView })
    async getDay(@CurrentUser() user: UserEntity, @Param() params: LogDateParam): Promise<DailySliceView> {
        return DailySliceView.from(await this.nutritionService.getDay(user.id, params.date));
    }

    @Post('days/:date/meals')
    @HttpCode(HttpStatus.CREATED)
    @ApiParam({ name: 'date', example: '2026-09-06' })
    @ApiCreatedResponse({ type: MealLogEntryView })
    async logMeal(
        @CurrentUser() user: UserEntity,
        @Param() params: LogDateParam,
        @Body() body: LogMealInboundDto,
    ): Promise<MealLogEntryView> {
        return MealLogEntryView.from(await this.nutritionService.logMeal(user.id, params.date, body));
    }

    @Delete('days/:date/meals/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Entry removed; the day totals drop accordingly.' })
    @ApiNotFoundResponse({ description: 'No such entry for this account.' })
    async deleteMeal(@CurrentUser() user: UserEntity, @Param('id') id: string): Promise<void> {
        await this.nutritionService.deleteMeal(user.id, id);
    }

    @Post('days/:date/water')
    @HttpCode(HttpStatus.CREATED)
    @ApiParam({ name: 'date', example: '2026-09-06' })
    @ApiCreatedResponse({ description: 'One glass recorded.' })
    async logWater(
        @CurrentUser() user: UserEntity,
        @Param() params: LogDateParam,
        @Body() body: LogWaterInboundDto,
    ): Promise<{ id: string; amountMl: number }> {
        const entry = await this.nutritionService.logWater(user.id, params.date, body);
        return { id: entry.id, amountMl: entry.amountMl };
    }

    /** Each glass is its own row precisely so a mis-tap can be taken back. */
    @Delete('days/:date/water/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Glass removed.' })
    @ApiNotFoundResponse({ description: 'No such entry for this account.' })
    async deleteWater(@CurrentUser() user: UserEntity, @Param('id') id: string): Promise<void> {
        await this.nutritionService.deleteWater(user.id, id);
    }

    /** `PUT`: the count is a running total, so a new report replaces the last. */
    @Put('days/:date/steps')
    @ApiParam({ name: 'date', example: '2026-09-06' })
    @ApiOkResponse({ description: 'The day count after the replacement.' })
    async setSteps(
        @CurrentUser() user: UserEntity,
        @Param() params: LogDateParam,
        @Body() body: SetStepsInboundDto,
    ): Promise<{ steps: number }> {
        const updated = await this.nutritionService.setSteps(user.id, params.date, body);
        return { steps: updated.steps };
    }
}
