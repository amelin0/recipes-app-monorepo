import { Module } from '@nestjs/common';

import { ProductRepositoryModule, ReferenceRepositoryModule } from '@dns/database';

import { CatalogController } from './catalog.controller';

@Module({
    imports: [ReferenceRepositoryModule, ProductRepositoryModule],
    controllers: [CatalogController],
})
export class CatalogModule {}
