import { Module } from '@nestjs/common';

import { BodyMeasurementRepository } from './body-measurement.repository';

@Module({
    providers: [BodyMeasurementRepository],
    exports: [BodyMeasurementRepository],
})
export class BodyMeasurementRepositoryModule {}
