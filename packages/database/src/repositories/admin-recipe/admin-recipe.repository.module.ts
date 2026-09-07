import { Module } from '@nestjs/common';

import { AdminRecipeRepository } from './admin-recipe.repository';

@Module({
    providers: [AdminRecipeRepository],
    exports: [AdminRecipeRepository],
})
export class AdminRecipeRepositoryModule {}
