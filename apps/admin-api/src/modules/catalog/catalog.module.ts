import { Module } from '@nestjs/common';

import { ReferenceRepositoryModule } from '@dns/database';

import { CatalogController } from './catalog.controller';

@Module({
    imports: [ReferenceRepositoryModule],
    controllers: [CatalogController],
})
export class CatalogModule {}
