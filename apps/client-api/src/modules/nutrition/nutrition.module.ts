import { Module } from '@nestjs/common';

import { NutritionRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';

import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
    imports: [AuthModule, NutritionRepositoryModule],
    controllers: [NutritionController],
    providers: [NutritionService],
})
export class NutritionModule {}
