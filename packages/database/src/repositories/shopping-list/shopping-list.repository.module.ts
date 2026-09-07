import { Module } from '@nestjs/common';

import { ShoppingListRepository } from './shopping-list.repository';

@Module({
    providers: [ShoppingListRepository],
    exports: [ShoppingListRepository],
})
export class ShoppingListRepositoryModule {}
