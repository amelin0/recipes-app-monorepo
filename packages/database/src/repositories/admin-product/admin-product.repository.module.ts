import { Module } from '@nestjs/common';

import { AdminProductRepository } from './admin-product.repository';

@Module({
    providers: [AdminProductRepository],
    exports: [AdminProductRepository],
})
export class AdminProductRepositoryModule {}
