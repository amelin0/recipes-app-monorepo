import { Injectable, NotFoundException } from '@nestjs/common';

import { RECIPE_CALORIE_FILTER } from '@dns/constants';
import {
    ProductEntity,
    ProductRepository,
    RecipeEntity,
    RecipeIngredientEntity,
    RecipeRepository,
    RecipeStepEntity,
    ReferenceEntity,
    ReferenceRepository,
} from '@dns/database';
import { RecipeListQuery } from '@dns/validation';

import { CatalogErrorCode } from './catalog.errors';
import { ReaderLanguageService } from './reader-language.service';

export interface RecipeSearchResult {
    items: RecipeEntity[];
    total: number;
}

export interface RecipeDetail {
    recipe: RecipeEntity;
    ingredients: RecipeIngredientEntity[];
    steps: RecipeStepEntity[];
}

export interface RecipeFilterOptions {
    quickProducts: ProductEntity[];
    categories: ReferenceEntity[];
    productGroups: ReferenceEntity[];
    cuisines: ReferenceEntity[];
    diets: ReferenceEntity[];
    calories: { min: number; max: number; step: number };
}

@Injectable()
export class RecipeService {
    constructor(
        private readonly recipes: RecipeRepository,
        private readonly products: ProductRepository,
        private readonly references: ReferenceRepository,
        private readonly language: ReaderLanguageService,
    ) {}

    /**
     * One list endpoint behind all three tabs and both screens.
     *
     * The tab is a query parameter rather than a path of its own because it is
     * the same collection narrowed three ways (ADR-0004) — and because the
     * filters have to keep working on every tab. Hiding their effect on
     * «Favourites» while the chips stay on screen would make the count on the
     * filter icon a lie.
     *
     * `meta.total` is what the filter screen's «Показати N результатів» reads;
     * there is deliberately no separate count route, so the number under the
     * button and the list behind it can never disagree.
     */
    async list(userId: string, query: RecipeListQuery): Promise<RecipeSearchResult> {
        const language = await this.language.of(userId);

        return this.recipes.list({
            userId,
            language,
            page: query.page,
            limit: query.limit,
            filters: {
                tab: query.tab,
                query: query.q,
                categoryIds: query.categories,
                cuisineIds: query.cuisines,
                dietIds: query.diets,
                productIds: query.products,
                productGroupIds: query.productGroups,
                caloriesMin: query.caloriesMin,
                // The top of the slider reads «800+», which means no ceiling —
                // a request pinned there must not hide every richer dish
                // (recipe-filters FR-003).
                caloriesMax: query.caloriesMax === RECIPE_CALORIE_FILTER.max ? undefined : query.caloriesMax,
            },
        });
    }

    async detail(userId: string, id: string): Promise<RecipeDetail> {
        const language = await this.language.of(userId);
        const recipe = await this.recipes.findById(id, userId, language);
        if (!recipe) throw this.notFound();

        const [ingredients, steps] = await Promise.all([
            this.recipes.ingredientsOf(id, language),
            this.recipes.stepsOf(id, language),
        ]);

        return { recipe, ingredients, steps };
    }

    async filters(userId: string): Promise<RecipeFilterOptions> {
        const language = await this.language.of(userId);

        const [quickProducts, categories, productGroups, cuisines, diets] = await Promise.all([
            this.products.findQuickPicks(language),
            this.references.categories(language),
            this.references.productGroups(language),
            this.references.cuisines(language),
            this.references.diets(language),
        ]);

        return {
            quickProducts,
            categories,
            productGroups,
            cuisines,
            diets,
            calories: { ...RECIPE_CALORIE_FILTER },
        };
    }

    async addFavorite(userId: string, recipeId: string): Promise<void> {
        if (!(await this.recipes.exists(recipeId, userId))) throw this.notFound();
        await this.recipes.addFavorite(userId, recipeId);
    }

    /**
     * Unhearting something that was never hearted still ends with it not being
     * hearted, so it answers 204 rather than 404 — the client taps this on a
     * flaky connection and must not have to tell the two cases apart.
     */
    async removeFavorite(userId: string, recipeId: string): Promise<void> {
        if (!(await this.recipes.exists(recipeId, userId))) throw this.notFound();
        await this.recipes.removeFavorite(userId, recipeId);
    }

    /** Same answer whether the dish is missing or simply someone else's own. */
    private notFound(): NotFoundException {
        return new NotFoundException({ message: 'No such recipe', code: CatalogErrorCode.RecipeNotFound });
    }
}
