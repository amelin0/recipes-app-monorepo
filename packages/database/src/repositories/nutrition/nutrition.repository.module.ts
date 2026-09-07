import { Module } from '@nestjs/common';

import { NutritionRepository } from './nutrition.repository';

@Module({
    providers: [NutritionRepository],
    exports: [NutritionRepository],
})
export class NutritionRepositoryModule {}
