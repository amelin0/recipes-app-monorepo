import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminProductRepositoryModule } from '@dns/database';

import { ProductImportService } from './import/product-import.service';
import { AdminProductController } from './product.controller';
import { AdminProductService } from './product.service';

@Module({
    imports: [ConfigModule, AdminProductRepositoryModule],
    controllers: [AdminProductController],
    providers: [AdminProductService, ProductImportService],
    exports: [AdminProductService],
})
export class ProductModule {}
