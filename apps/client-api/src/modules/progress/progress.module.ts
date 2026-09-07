import { Module } from '@nestjs/common';

import { BodyMeasurementRepositoryModule, NutritionRepositoryModule, ProfileRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';

import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
    imports: [AuthModule, BodyMeasurementRepositoryModule, NutritionRepositoryModule, ProfileRepositoryModule],
    controllers: [ProgressController],
    providers: [ProgressService],
})
export class ProgressModule {}
