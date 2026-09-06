import { Module } from '@nestjs/common';

import {
    ProductRepositoryModule,
    RecipeRepositoryModule,
    ReferenceRepositoryModule,
    UserSettingsRepositoryModule,
} from '@dns/database';

import { AuthModule } from '../auth';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ReaderLanguageService } from './reader-language.service';
import { RecipeController } from './recipe.controller';
import { RecipeService } from './recipe.service';

/**
 * Recipes and products in one module because ADR-0006 made them one domain: a
 * product in a dish is that dish's ingredient, the search screen shows both
 * side by side, and both are read in the same language by the same rules.
 */
@Module({
    imports: [
        AuthModule,
        RecipeRepositoryModule,
        ProductRepositoryModule,
        ReferenceRepositoryModule,
        UserSettingsRepositoryModule,
    ],
    controllers: [RecipeController, ProductController],
    providers: [RecipeService, ProductService, ReaderLanguageService],
})
export class CatalogModule {}
