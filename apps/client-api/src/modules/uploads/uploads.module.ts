import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';

import { UploadsController } from './uploads.controller';

@Module({
    // StorageModule is registered globally in AppModule, so StorageService
    // needs no import here.
    imports: [AuthModule],
    controllers: [UploadsController],
})
export class UploadsModule {}
