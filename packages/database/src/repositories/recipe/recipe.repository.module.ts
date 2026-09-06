import { Module } from '@nestjs/common';

import { RecipeRepository } from './recipe.repository';

@Module({
    providers: [RecipeRepository],
    exports: [RecipeRepository],
})
export class RecipeRepositoryModule {}
