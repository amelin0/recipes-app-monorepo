import { Module } from '@nestjs/common';

import { ProductRepositoryModule, ReferenceRepositoryModule, ShoppingListRepositoryModule } from '@dns/database';

import { AuthModule } from '../auth';
import { CatalogModule } from '../catalog';

import { ShoppingListController } from './shopping-list.controller';
import { ShoppingListService } from './shopping-list.service';

@Module({
    imports: [
        AuthModule,
        CatalogModule,
        ShoppingListRepositoryModule,
        ProductRepositoryModule,
        ReferenceRepositoryModule,
    ],
    controllers: [ShoppingListController],
    providers: [ShoppingListService],
})
export class ShoppingListModule {}
