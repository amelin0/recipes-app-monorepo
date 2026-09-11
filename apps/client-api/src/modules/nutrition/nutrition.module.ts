import { Module } from '@nestjs/common';

import { NutritionRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';
import { MealPlanModule } from '../meal-plan';

import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
    imports: [AuthModule, NutritionRepositoryModule, MealPlanModule],
    controllers: [NutritionController],
    providers: [NutritionService],
})
export class NutritionModule {}
