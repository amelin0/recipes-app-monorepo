import { Module } from '@nestjs/common';

import { UploadController } from './upload.controller';

// StorageModule is registered globally in AppModule, so nothing to import here.
@Module({ controllers: [UploadController] })
export class UploadModule {}
