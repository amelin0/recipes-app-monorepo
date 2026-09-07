import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import {
    AdminRecipeDetail,
    AdminRecipeListItem,
    AdminRecipeRepository,
    ProductEntity,
    ProductRepository,
    WriteRecipeInput,
} from '@dns/database';
import { AdminCreateRecipeInput, AdminRecipeListQuery } from '@dns/validation';

import { RecipeErrorCode } from './recipe.errors';

export interface ComputedMacros {
    calories: number;
    proteinG: string;
    fatsG: string;
    carbsG: string;
    totalWeightG: string;
}

@Injectable()
export class AdminRecipeService {
    constructor(
        private readonly recipeRepository: AdminRecipeRepository,
        private readonly productRepository: ProductRepository,
    ) {}

    list(query: AdminRecipeListQuery): Promise<{ items: AdminRecipeListItem[]; total: number }> {
        return this.recipeRepository.list({
            language: query.language,
            filters: {
                search: query.search,
                categoryId: query.categoryId,
                cuisineId: query.cuisineId,
                dietIds: query.dietIds,
            },
            page: query.page,
            limit: query.limit,
        });
    }

    async findById(id: string): Promise<AdminRecipeDetail> {
        const recipe = await this.recipeRepository.findById(id);
        if (!recipe) throw new NotFoundException({ message: 'Recipe not found', code: RecipeErrorCode.NotFound });
        return recipe;
    }

    async create(input: AdminCreateRecipeInput): Promise<string> {
        await this.assertImportKeyFree(input.importKey, null);
        return this.recipeRepository.create(await this.toWriteInput(input));
    }

    async update(id: string, input: AdminCreateRecipeInput): Promise<void> {
        await this.assertImportKeyFree(input.importKey, id);

        const updated = await this.recipeRepository.update(id, await this.toWriteInput(input));
        if (!updated) throw new NotFoundException({ message: 'Recipe not found', code: RecipeErrorCode.NotFound });
    }

    /**
     * Removes dishes, unless somebody has one in their week.
     *
     * What *should* happen to a planned dish is an open product question (see
     * the spec). Until it is answered the safe reading is to refuse: an editor
     * can be told and choose, whereas a user whose Tuesday quietly emptied
     * cannot.
     */
    async deleteMany(ids: string[]): Promise<number> {
        const planned = await this.recipeRepository.findPlanned(ids);

        if (planned.length > 0) {
            throw new ConflictException({
                message: 'Some dishes are in a user meal plan and were not deleted',
                code: RecipeErrorCode.RecipeInUse,
                errors: planned.map(id => ({ path: id, message: 'in a meal plan' })),
            });
        }

        return this.recipeRepository.deleteMany(ids);
    }

    /**
     * Turns a validated payload into a row, resolving the products and
     * computing the macros on the way.
     *
     * The numbers are **not** taken from the request. A dish's figures have to
     * agree with the ingredient list shown underneath them, and the only way to
     * guarantee that is to derive them from the same source the list is drawn
     * from. The column stays stored rather than computed on read for the
     * reason recipes.schema.ts gives: editing a product must not silently
     * rewrite what somebody already logged as eaten.
     */
    private async toWriteInput(input: AdminCreateRecipeInput): Promise<WriteRecipeInput> {
        const products = await this.resolveProducts(input.ingredients.map(line => line.productId));
        const macros = this.computeMacros(input.ingredients, products);

        return {
            importKey: input.importKey,
            categoryId: input.categoryId,
            cuisineId: input.cuisineId,
            photoUrl: input.photoUrl,
            servings: input.servings,
            cookTimeMinutes: input.cookTimeMinutes,
            ...macros,
            translations: input.translations,
            ingredients: input.ingredients.map(line => ({
                productId: line.productId,
                amountG: line.amountG.toFixed(2),
            })),
            steps: input.steps.map(step => ({
                stepNumber: step.stepNumber,
                durationMinutes: step.durationMinutes,
                translations: step.translations,
                ingredientIndexes: step.ingredientIndexes,
            })),
            dietIds: input.dietIds,
        };
    }

    private computeMacros(
        ingredients: AdminCreateRecipeInput['ingredients'],
        products: Map<string, ProductEntity>,
    ): ComputedMacros {
        let calories = 0;
        let protein = 0;
        let fats = 0;
        let carbs = 0;
        let weight = 0;

        for (const line of ingredients) {
            // Non-null: resolveProducts has already thrown for anything missing.
            const product = products.get(line.productId) as ProductEntity;
            const factor = line.amountG / 100;

            calories += product.caloriesPer100g * factor;
            protein += product.proteinPer100g * factor;
            fats += product.fatsPer100g * factor;
            carbs += product.carbsPer100g * factor;
            weight += line.amountG;
        }

        return {
            calories: Math.round(calories),
            proteinG: protein.toFixed(2),
            fatsG: fats.toFixed(2),
            carbsG: carbs.toFixed(2),
            totalWeightG: weight.toFixed(2),
        };
    }

    /**
     * Loads every product the composition names, and refuses the whole dish if
     * one is missing (FR-005).
     *
     * Creating the product instead would put a row with no macros into the
     * catalogue and make the dish uncountable — the failure would move from
     * this request to a number on a phone weeks later.
     */
    private async resolveProducts(ids: string[]): Promise<Map<string, ProductEntity>> {
        const unique = [...new Set(ids)];
        const found = await this.productRepository.findGlobalByIds(unique, DEFAULT_LANGUAGE);

        const byId = new Map(found.map(product => [product.id, product]));
        const missing = unique.filter(id => !byId.has(id));

        if (missing.length > 0) {
            throw new BadRequestException({
                message: 'Some ingredients are not in the product catalogue',
                code: RecipeErrorCode.UnknownProduct,
                errors: missing.map(id => ({ path: id, message: 'unknown product' })),
            });
        }

        return byId;
    }

    private async assertImportKeyFree(importKey: string | null, selfId: string | null): Promise<void> {
        if (!importKey) return;

        const owner = await this.recipeRepository.findIdByImportKey(importKey);
        if (owner && owner !== selfId) {
            throw new ConflictException({
                message: `Import key "${importKey}" already belongs to another recipe`,
                code: RecipeErrorCode.DuplicateImportKey,
            });
        }
    }
}
