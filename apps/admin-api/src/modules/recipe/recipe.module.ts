import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminRecipeRepositoryModule, ProductRepositoryModule, ReferenceRepositoryModule } from '@dns/database';

import { RecipeImportService } from './import/import.service';
import { AdminRecipeController } from './recipe.controller';
import { AdminRecipeService } from './recipe.service';

@Module({
    imports: [ConfigModule, AdminRecipeRepositoryModule, ProductRepositoryModule, ReferenceRepositoryModule],
    controllers: [AdminRecipeController],
    providers: [AdminRecipeService, RecipeImportService],
    exports: [AdminRecipeService],
})
export class RecipeModule {}
