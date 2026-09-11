import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, exists, ilike, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { ContentSource } from '@dns/shared-types';

import {
    cuisines,
    dishCategories,
    mealPlanItems,
    productTranslations,
    products,
    recipeDiets,
    recipeFavorites,
    recipeIngredients,
    recipeStepIngredients,
    recipeStepTranslations,
    recipeSteps,
    recipeTranslations,
    recipes,
} from '../../schema';
import { BaseRepository, DrizzleDB } from '../base.repository';

export interface AdminRecipeFilters {
    search?: string;
    categoryId?: string;
    cuisineId?: string;
    dietIds?: string[];
}

export interface AdminRecipeListItem {
    id: string;
    title: string;
    photoUrl: string | null;
    calories: number;
    proteinG: string;
    fatsG: string;
    carbsG: string;
    servings: number;
    cookTimeMinutes: number | null;
    importKey: string | null;
    favoritesCount: number;
    categorySlug: string | null;
    cuisineSlug: string | null;
    updatedAt: Date;
}

export interface AdminRecipeTranslation {
    language: string;
    title: string;
}

export interface AdminRecipeStepInput {
    stepNumber: number;
    durationMinutes: number | null;
    translations: { language: string; title: string; description: string | null }[];
    /** Positions in `ingredients`, resolved to row ids once they exist. */
    ingredientIndexes: number[];
}

export interface AdminRecipeIngredientInput {
    productId: string;
    amountG: string;
}

export interface WriteRecipeInput {
    importKey: string | null;
    categoryId: string | null;
    cuisineId: string | null;
    photoUrl: string | null;
    servings: number;
    cookTimeMinutes: number | null;
    totalWeightG: string;
    calories: number;
    proteinG: string;
    fatsG: string;
    carbsG: string;
    translations: AdminRecipeTranslation[];
    ingredients: AdminRecipeIngredientInput[];
    steps: AdminRecipeStepInput[];
    dietIds: string[];
}

export interface AdminRecipeDetail {
    id: string;
    importKey: string | null;
    photoUrl: string | null;
    servings: number;
    cookTimeMinutes: number | null;
    totalWeightG: string | null;
    calories: number;
    proteinG: string;
    fatsG: string;
    carbsG: string;
    categoryId: string | null;
    cuisineId: string | null;
    dietIds: string[];
    favoritesCount: number;
    translations: AdminRecipeTranslation[];
    ingredients: { id: string; productId: string; productName: string; amountG: string; sortOrder: number }[];
    steps: {
        id: string;
        stepNumber: number;
        durationMinutes: number | null;
        translations: { language: string; title: string; description: string | null }[];
        ingredientIds: string[];
    }[];
    createdAt: Date;
    updatedAt: Date;
}

@Injectable()
export class AdminRecipeRepository extends BaseRepository {
    /**
     * The catalogue list, one page at a time.
     *
     * Only `source = 'global'`. A user's own dish is their private data and has
     * no business appearing in a staff list — the admin panel edits the
     * catalogue, not people's kitchens.
     */
    async list(params: {
        language: string;
        filters: AdminRecipeFilters;
        page: number;
        limit: number;
    }): Promise<{ items: AdminRecipeListItem[]; total: number }> {
        const preferred = alias(recipeTranslations, 'preferred_title');
        const fallback = alias(recipeTranslations, 'fallback_title');
        const title = sql<string>`coalesce(${preferred.title}, ${fallback.title}, '')`;

        const where = and(...this.conditions(params.filters, title));

        const rows = await this.db
            .select({
                id: recipes.id,
                title,
                photoUrl: recipes.photoUrl,
                calories: recipes.calories,
                proteinG: recipes.proteinG,
                fatsG: recipes.fatsG,
                carbsG: recipes.carbsG,
                servings: recipes.servings,
                cookTimeMinutes: recipes.cookTimeMinutes,
                importKey: recipes.importKey,
                categorySlug: dishCategories.slug,
                cuisineSlug: cuisines.slug,
                updatedAt: recipes.updatedAt,
                // A correlated count rather than a column: the number is only
                // ever read here, and a counter column would need a trigger or
                // a write on every heart — cost paid by the mobile app so the
                // panel can show a figure nobody acts on precisely.
                favoritesCount: sql<number>`(
                    select count(*)::int from ${recipeFavorites}
                    where ${recipeFavorites.recipeId} = ${recipes.id}
                )`,
            })
            .from(recipes)
            .leftJoin(preferred, and(eq(preferred.recipeId, recipes.id), eq(preferred.language, params.language)))
            .leftJoin(fallback, and(eq(fallback.recipeId, recipes.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .leftJoin(dishCategories, eq(dishCategories.id, recipes.categoryId))
            .leftJoin(cuisines, eq(cuisines.id, recipes.cuisineId))
            .where(where)
            .orderBy(desc(recipes.updatedAt), asc(recipes.id))
            .limit(params.limit)
            .offset((params.page - 1) * params.limit);

        const [countRow] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(recipes)
            .leftJoin(preferred, and(eq(preferred.recipeId, recipes.id), eq(preferred.language, params.language)))
            .leftJoin(fallback, and(eq(fallback.recipeId, recipes.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(where);

        return { items: rows, total: countRow?.total ?? 0 };
    }

    /** Everything the edit form needs, in one round trip's worth of queries. */
    async findById(id: string): Promise<AdminRecipeDetail | null> {
        const [recipe] = await this.db
            .select()
            .from(recipes)
            .where(and(eq(recipes.id, id), eq(recipes.source, ContentSource.Global)))
            .limit(1);

        if (!recipe) return null;

        const [translations, dietRows, ingredientRows, stepRows, favorites] = await Promise.all([
            this.db
                .select({ language: recipeTranslations.language, title: recipeTranslations.title })
                .from(recipeTranslations)
                .where(eq(recipeTranslations.recipeId, id)),
            this.db.select({ dietId: recipeDiets.dietId }).from(recipeDiets).where(eq(recipeDiets.recipeId, id)),
            this.db
                .select({
                    id: recipeIngredients.id,
                    productId: recipeIngredients.productId,
                    amountG: recipeIngredients.amountG,
                    sortOrder: recipeIngredients.sortOrder,
                    productName: productTranslations.name,
                })
                .from(recipeIngredients)
                .innerJoin(products, eq(products.id, recipeIngredients.productId))
                .leftJoin(
                    productTranslations,
                    and(
                        eq(productTranslations.productId, products.id),
                        eq(productTranslations.language, DEFAULT_LANGUAGE),
                    ),
                )
                .where(eq(recipeIngredients.recipeId, id))
                .orderBy(asc(recipeIngredients.sortOrder)),
            this.db
                .select({
                    id: recipeSteps.id,
                    stepNumber: recipeSteps.stepNumber,
                    durationMinutes: recipeSteps.durationMinutes,
                })
                .from(recipeSteps)
                .where(eq(recipeSteps.recipeId, id))
                .orderBy(asc(recipeSteps.stepNumber)),
            this.db
                .select({ total: sql<number>`count(*)::int` })
                .from(recipeFavorites)
                .where(eq(recipeFavorites.recipeId, id)),
        ]);

        const stepIds = stepRows.map(step => step.id);
        const [stepTranslations, stepChips] =
            stepIds.length === 0
                ? [[], []]
                : await Promise.all([
                      this.db
                          .select()
                          .from(recipeStepTranslations)
                          .where(inArray(recipeStepTranslations.stepId, stepIds)),
                      this.db
                          .select()
                          .from(recipeStepIngredients)
                          .where(inArray(recipeStepIngredients.stepId, stepIds)),
                  ]);

        return {
            id: recipe.id,
            importKey: recipe.importKey,
            photoUrl: recipe.photoUrl,
            servings: recipe.servings,
            cookTimeMinutes: recipe.cookTimeMinutes,
            totalWeightG: recipe.totalWeightG,
            calories: recipe.calories,
            proteinG: recipe.proteinG,
            fatsG: recipe.fatsG,
            carbsG: recipe.carbsG,
            categoryId: recipe.categoryId,
            cuisineId: recipe.cuisineId,
            dietIds: dietRows.map(row => row.dietId),
            favoritesCount: favorites[0]?.total ?? 0,
            translations,
            ingredients: ingredientRows.map(row => ({
                id: row.id,
                productId: row.productId,
                productName: row.productName ?? '',
                amountG: row.amountG,
                sortOrder: row.sortOrder,
            })),
            steps: stepRows.map(step => ({
                id: step.id,
                stepNumber: step.stepNumber,
                durationMinutes: step.durationMinutes,
                translations: stepTranslations
                    .filter(row => row.stepId === step.id)
                    .map(row => ({ language: row.language, title: row.title, description: row.description })),
                ingredientIds: stepChips.filter(row => row.stepId === step.id).map(row => row.recipeIngredientId),
            })),
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
        };
    }

    async create(input: WriteRecipeInput): Promise<string> {
        return this.db.transaction(async tx => {
            const [recipe] = await tx
                .insert(recipes)
                .values({
                    source: ContentSource.Global,
                    createdBy: null,
                    importKey: input.importKey,
                    categoryId: input.categoryId,
                    cuisineId: input.cuisineId,
                    photoUrl: input.photoUrl,
                    cookTimeMinutes: input.cookTimeMinutes,
                    servings: input.servings,
                    totalWeightG: input.totalWeightG,
                    calories: input.calories,
                    proteinG: input.proteinG,
                    fatsG: input.fatsG,
                    carbsG: input.carbsG,
                })
                .returning({ id: recipes.id });

            if (!recipe) throw new Error('Failed to insert recipe');

            await this.writeChildren(tx, recipe.id, input);

            return recipe.id;
        });
    }

    /**
     * Replaces a catalogue recipe in place.
     *
     * Composition and steps are **replaced wholesale**, not merged. Merging two
     * ordered collections that also carry cross-references between them is
     * where silent corruption lives: a step keeps pointing at an ingredient the
     * caller removed, or `sortOrder` ends up with two 3s. The caller sends the
     * full list; the transaction makes the swap atomic.
     */
    async update(id: string, input: WriteRecipeInput): Promise<boolean> {
        return this.db.transaction(async tx => {
            const updated = await tx
                .update(recipes)
                .set({
                    importKey: input.importKey,
                    categoryId: input.categoryId,
                    cuisineId: input.cuisineId,
                    photoUrl: input.photoUrl,
                    cookTimeMinutes: input.cookTimeMinutes,
                    servings: input.servings,
                    totalWeightG: input.totalWeightG,
                    calories: input.calories,
                    proteinG: input.proteinG,
                    fatsG: input.fatsG,
                    carbsG: input.carbsG,
                    updatedAt: new Date(),
                })
                .where(and(eq(recipes.id, id), eq(recipes.source, ContentSource.Global)))
                .returning({ id: recipes.id });

            if (updated.length === 0) return false;

            // Steps and their chips go by cascade from recipe_steps; the
            // ingredient rows have to be named because nothing cascades to
            // them from the recipe's own row being untouched.
            await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
            await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
            await tx.delete(recipeTranslations).where(eq(recipeTranslations.recipeId, id));
            await tx.delete(recipeDiets).where(eq(recipeDiets.recipeId, id));

            await this.writeChildren(tx, id, input);

            return true;
        });
    }

    /** Looks a dish up by the key its import file gave it (FR-004). */
    async findIdByImportKey(importKey: string): Promise<string | null> {
        const [row] = await this.db
            .select({ id: recipes.id })
            .from(recipes)
            .where(eq(recipes.importKey, importKey))
            .limit(1);

        return row?.id ?? null;
    }

    /**
     * Removes catalogue dishes by id — all of them, or none if any is in
     * somebody's meal plan.
     *
     * The product decision about what deleting a planned dish should do is
     * still open (see the spec), so until it is made the answer is to refuse
     * rather than silently empty somebody's week: `meal_plan_items` cascades
     * from `recipes`, so a delete that got through would take the plan rows
     * with it and nobody would be told.
     *
     * **Why the lock.** Checking for plans and then deleting were two
     * statements, and a user could plan the dish in between — the check saw
     * nothing, the delete cascaded, and their Tuesday quietly emptied. So the
     * dishes are locked `FOR UPDATE` first, in id order (two overlapping
     * deletes then queue instead of deadlocking), and only then checked.
     *
     * `FOR UPDATE` specifically, and not the weaker `FOR NO KEY UPDATE`: the
     * foreign-key check that guards every insert into `meal_plan_items` takes
     * `FOR KEY SHARE` on the referenced recipe, and only `FOR UPDATE` (or a
     * delete) conflicts with that. With it, the two orders are both safe:
     *
     * - a plan insert **already in flight** holds its `KEY SHARE` lock, so the
     *   lock here waits for it to commit — and the check, a fresh statement
     *   under READ COMMITTED, then sees the new plan row and refuses;
     * - a plan insert **arriving after** the lock waits on it; if this
     *   deletes, the insert's foreign-key check finds the dish gone and fails
     *   (23503) — the user's request errors instead of their plan silently
     *   losing a row. If this refuses, the insert proceeds.
     *
     * `source = 'global'` in the lock's WHERE, so no request can reach
     * somebody's own dish through this route however the ids were obtained.
     */
    async deleteUnlessPlanned(ids: string[]): Promise<{ deleted: number; planned: string[] }> {
        if (ids.length === 0) return { deleted: 0, planned: [] };

        return this.db.transaction(async tx => {
            const locked = await tx
                .select({ id: recipes.id })
                .from(recipes)
                .where(and(inArray(recipes.id, ids), eq(recipes.source, ContentSource.Global)))
                .orderBy(asc(recipes.id))
                .for('update');

            if (locked.length === 0) return { deleted: 0, planned: [] };

            const lockedIds = locked.map(row => row.id);

            const planned = await tx
                .selectDistinct({ id: mealPlanItems.recipeId })
                .from(mealPlanItems)
                .where(inArray(mealPlanItems.recipeId, lockedIds));

            if (planned.length > 0) return { deleted: 0, planned: planned.map(row => row.id) };

            const deleted = await tx
                .delete(recipes)
                .where(inArray(recipes.id, lockedIds))
                .returning({ id: recipes.id });

            return { deleted: deleted.length, planned: [] };
        });
    }

    private async writeChildren(tx: DrizzleDB, recipeId: string, input: WriteRecipeInput): Promise<void> {
        await tx
            .insert(recipeTranslations)
            .values(input.translations.map(t => ({ recipeId, language: t.language, title: t.title })));

        if (input.dietIds.length > 0) {
            await tx.insert(recipeDiets).values(input.dietIds.map(dietId => ({ recipeId, dietId })));
        }

        // Sequential, not Promise.all: the ids come back in the order the rows
        // were inserted, and `ingredientIndexes` in the steps below refers to
        // positions in the input array. Concurrent inserts would still return
        // correct ids, but `sortOrder` and the index mapping are easier to
        // reason about — and to debug — when the order is the loop's.
        const ingredientIds: string[] = [];
        for (const [index, ingredient] of input.ingredients.entries()) {
            const [row] = await tx
                .insert(recipeIngredients)
                .values({
                    recipeId,
                    productId: ingredient.productId,
                    amountG: ingredient.amountG,
                    sortOrder: index,
                })
                .returning({ id: recipeIngredients.id });

            if (!row) throw new Error('Failed to insert recipe ingredient');
            ingredientIds.push(row.id);
        }

        for (const step of input.steps) {
            const [row] = await tx
                .insert(recipeSteps)
                .values({ recipeId, stepNumber: step.stepNumber, durationMinutes: step.durationMinutes })
                .returning({ id: recipeSteps.id });

            if (!row) throw new Error('Failed to insert recipe step');

            if (step.translations.length > 0) {
                await tx.insert(recipeStepTranslations).values(
                    step.translations.map(t => ({
                        stepId: row.id,
                        language: t.language,
                        title: t.title,
                        description: t.description,
                    })),
                );
            }

            const chips = step.ingredientIndexes
                .map(position => ingredientIds[position])
                .filter((value): value is string => value !== undefined);

            if (chips.length > 0) {
                await tx
                    .insert(recipeStepIngredients)
                    .values(chips.map(recipeIngredientId => ({ stepId: row.id, recipeIngredientId })));
            }
        }
    }

    private conditions(filters: AdminRecipeFilters, title: SQL<string>): SQL[] {
        const conditions: SQL[] = [eq(recipes.source, ContentSource.Global)];

        if (filters.search) {
            // A substring scan, which no btree serves. Fine at thousands of
            // rows; a trigram index is the answer when it stops being fine,
            // and not before.
            conditions.push(ilike(title, `%${filters.search}%`));
        }

        if (filters.categoryId) conditions.push(eq(recipes.categoryId, filters.categoryId));
        if (filters.cuisineId) conditions.push(eq(recipes.cuisineId, filters.cuisineId));

        // Every chosen diet must be present — «vegan AND gluten-free» narrows,
        // which is what a staff member filtering a catalogue expects. The
        // mobile filter unites instead (ADR-0006); the two screens ask
        // different questions of the same table.
        for (const dietId of filters.dietIds ?? []) {
            conditions.push(
                exists(
                    this.db
                        .select({ one: sql`1` })
                        .from(recipeDiets)
                        .where(and(eq(recipeDiets.recipeId, recipes.id), eq(recipeDiets.dietId, dietId))),
                ),
            );
        }

        return conditions;
    }
}
