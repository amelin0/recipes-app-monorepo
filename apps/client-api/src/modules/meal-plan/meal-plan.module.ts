import { Module } from '@nestjs/common';

import { MealPlanRepositoryModule, NutritionRepositoryModule, RecipeRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';
import { CatalogModule } from '../catalog';

import { MealPlanController } from './meal-plan.controller';
import { MealPlanService } from './meal-plan.service';

@Module({
    imports: [AuthModule, CatalogModule, MealPlanRepositoryModule, RecipeRepositoryModule, NutritionRepositoryModule],
    controllers: [MealPlanController],
    providers: [MealPlanService],
})
export class MealPlanModule {}
