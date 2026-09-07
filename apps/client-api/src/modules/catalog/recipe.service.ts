import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { StorageService } from '@dns/api-infrastructure/storage';
import { RECIPE_CALORIE_FILTER } from '@dns/constants';
import {
    CreateRecipeStep,
    ProductEntity,
    ProductRepository,
    RecipeEntity,
    RecipeIngredientEntity,
    RecipeRepository,
    RecipeStepEntity,
    ReferenceEntity,
    ReferenceRepository,
} from '@dns/database';
import { StorageScope } from '@dns/shared-types';
import { CreateRecipeInputDto, RecipeListQuery } from '@dns/validation';

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
        private readonly storage: StorageService,
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

    /**
     * Saves a dish somebody entered by hand (create-dish FR-001, FR-006).
     *
     * **Its nutrition is computed here, once, and then held still.** ADR-0006
     * defines it as `Σ(product.<figure> × amount_g / 100)`, which is the same
     * arithmetic the ingredient rows on the detail screen print — so the dish
     * total always equals the sum of the lines under it. Recomputing on every
     * read would instead rewrite history the first time a product's figures
     * are corrected, and a meal already logged from this dish would stop
     * matching the receipt the user was shown.
     *
     * Calories come from the products' own figure rather than from Atwater on
     * the three macros: USDA numbers account for fibre and sugar alcohols that
     * `4/4/9` does not, and the ingredient rows show that same figure.
     *
     * Servings, weight and cooking time are derived because the form collects
     * none of them: one serving, the weight of what went in, and the sum of
     * the step timers.
     */
    async create(userId: string, input: CreateRecipeInputDto): Promise<RecipeDetail> {
        const language = await this.language.of(userId);

        // A URL the client hands us is checked against the key layout, not
        // trusted: without this, `photoUrl` is a way to write any address into
        // our database and have every viewer of the dish fetch it.
        if (input.photoUrl) {
            this.storage.validateOwnership(input.photoUrl, userId, StorageScope.RecipePhoto);
        }

        if (input.cuisineId) await this.assertCuisineExists(input.cuisineId, language);

        const products = await this.loadIngredientProducts(userId, language, input);
        const steps = this.resolveSteps(input);

        const nutrition = input.ingredients.reduce(
            (running, ingredient) => {
                const product = products.get(ingredient.productId);
                if (!product) throw this.unknownProduct();

                const ratio = ingredient.amountG / 100;
                return {
                    calories: running.calories + product.caloriesPer100g * ratio,
                    proteinG: running.proteinG + product.proteinPer100g * ratio,
                    fatsG: running.fatsG + product.fatsPer100g * ratio,
                    carbsG: running.carbsG + product.carbsPer100g * ratio,
                    weightG: running.weightG + ingredient.amountG,
                };
            },
            { calories: 0, proteinG: 0, fatsG: 0, carbsG: 0, weightG: 0 },
        );

        const timed = steps.filter(step => step.durationMinutes !== null);

        const id = await this.recipes.createOwn({
            createdBy: userId,
            language,
            title: input.title,
            cuisineId: input.cuisineId ?? null,
            photoUrl: input.photoUrl ?? null,
            servings: 1,
            totalWeightG: nutrition.weightG.toFixed(2),
            cookTimeMinutes:
                timed.length > 0 ? timed.reduce((sum, step) => sum + (step.durationMinutes ?? 0), 0) : null,
            calories: Math.round(nutrition.calories),
            proteinG: nutrition.proteinG.toFixed(2),
            fatsG: nutrition.fatsG.toFixed(2),
            carbsG: nutrition.carbsG.toFixed(2),
            ingredients: input.ingredients.map(ingredient => ({
                productId: ingredient.productId,
                amountG: ingredient.amountG.toFixed(2),
            })),
            steps,
        });

        return this.detail(userId, id);
    }

    /** Only a dish this account made. A catalogue recipe is not deletable by anybody here. */
    async remove(userId: string, recipeId: string): Promise<void> {
        if (!(await this.recipes.deleteOwn(userId, recipeId))) throw this.notFound();
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

    /**
     * Every product the composition names, fetched in one go and scoped to
     * what this account may see — so a dish cannot be built out of somebody
     * else's private product and quietly expose its name.
     */
    private async loadIngredientProducts(
        userId: string,
        language: string,
        input: CreateRecipeInputDto,
    ): Promise<Map<string, ProductEntity>> {
        const ids = [...new Set(input.ingredients.map(ingredient => ingredient.productId))];
        const found = await this.products.findByIds(ids, userId, language);

        if (found.length !== ids.length) throw this.unknownProduct();

        return new Map(found.map(product => [product.id, product]));
    }

    /** Chips are positions in the list being created; a position past its end is a bad request, not an empty step. */
    private resolveSteps(input: CreateRecipeInputDto): CreateRecipeStep[] {
        return (input.steps ?? []).map(step => {
            const indexes = step.ingredientIndexes ?? [];

            if (indexes.some(index => index >= input.ingredients.length)) {
                throw new BadRequestException({
                    message: 'A step refers to an ingredient this dish does not have',
                    code: CatalogErrorCode.UnknownStepIngredient,
                });
            }

            return {
                title: step.title ?? null,
                description: step.description ?? null,
                durationMinutes: step.durationMinutes ?? null,
                ingredientIndexes: [...new Set(indexes)],
            };
        });
    }

    private async assertCuisineExists(cuisineId: string, language: string): Promise<void> {
        const cuisines = await this.references.cuisines(language);

        if (!cuisines.some(cuisine => cuisine.id === cuisineId)) {
            throw new BadRequestException({
                message: 'No such cuisine',
                code: CatalogErrorCode.UnknownCuisine,
            });
        }
    }

    private unknownProduct(): BadRequestException {
        return new BadRequestException({
            message: 'An ingredient names a product that does not exist',
            code: CatalogErrorCode.UnknownProduct,
        });
    }
}
