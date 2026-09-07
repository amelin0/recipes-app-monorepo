import { Module } from '@nestjs/common';

import { MealPlanRepository } from './meal-plan.repository';

@Module({
    providers: [MealPlanRepository],
    exports: [MealPlanRepository],
})
export class MealPlanRepositoryModule {}
