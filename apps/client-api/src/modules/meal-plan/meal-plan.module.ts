import { Module } from '@nestjs/common';

import {
    MealPlanRepositoryModule,
    NutritionRepositoryModule,
    RecipeRepositoryModule,
    ShoppingListRepositoryModule,
} from '@dns/database';

import { AuthModule } from '../auth';
import { CatalogModule } from '../catalog';

import { MealPlanController } from './meal-plan.controller';
import { MealPlanService } from './meal-plan.service';

@Module({
    imports: [
        AuthModule,
        CatalogModule,
        MealPlanRepositoryModule,
        RecipeRepositoryModule,
        NutritionRepositoryModule,
        // Only to read one switch: whether the plan already feeds the list.
        ShoppingListRepositoryModule,
    ],
    controllers: [MealPlanController],
    providers: [MealPlanService],
    // The tracking screen lists today's planned dishes (daily-tracking FR-006a).
    exports: [MealPlanService],
})
export class MealPlanModule {}
