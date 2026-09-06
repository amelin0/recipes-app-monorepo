import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, exists, ilike, inArray, isNotNull, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { ContentSource, RecipeTab } from '@dns/shared-types';

import { ReferenceEntity, RecipeEntity, RecipeIngredientEntity, RecipeStepEntity } from '../../entities';
import {
    cuisineTranslations,
    cuisines,
    dietTranslations,
    diets,
    dishCategories,
    dishCategoryTranslations,
    productTranslations,
    products,
    recipeDiets,
    recipeFavorites,
    recipeIngredients,
    recipeStepTranslations,
    recipeSteps,
    recipeTranslations,
    recipes,
} from '../../schema';
import { BaseRepository } from '../base.repository';

export interface RecipeFilters {
    tab: RecipeTab;
    query?: string;
    categoryIds?: string[];
    cuisineIds?: string[];
    dietIds?: string[];
    productIds?: string[];
    productGroupIds?: string[];
    caloriesMin?: number;
    caloriesMax?: number;
}

export interface RecipePage {
    items: RecipeEntity[];
    total: number;
}

@Injectable()
export class RecipeRepository extends BaseRepository {
    async list(params: {
        userId: string;
        language: string;
        filters: RecipeFilters;
        page: number;
        limit: number;
    }): Promise<RecipePage> {
        const { userId, language, filters } = params;

        const preferred = alias(recipeTranslations, 'preferred_recipe_title');
        const fallback = alias(recipeTranslations, 'fallback_recipe_title');
        const title = sql<string>`coalesce(${preferred.title}, ${fallback.title})`;

        const where = and(...this.conditions(userId, filters, title));

        const rows = await this.db
            .select({
                recipe: recipes,
                title,
                favoritedAt: recipeFavorites.createdAt,
            })
            .from(recipes)
            .leftJoin(preferred, and(eq(preferred.recipeId, recipes.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.recipeId, recipes.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .leftJoin(
                recipeFavorites,
                and(eq(recipeFavorites.recipeId, recipes.id), eq(recipeFavorites.userId, userId)),
            )
            .where(where)
            // Newest first in the catalogue; on the favourites tab, most
            // recently hearted first — the order that tab was collected in.
            .orderBy(
                filters.tab === RecipeTab.Favorite ? desc(recipeFavorites.createdAt) : desc(recipes.createdAt),
                asc(recipes.id),
            )
            .limit(params.limit)
            .offset((params.page - 1) * params.limit);

        const [countRow] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(recipes)
            .leftJoin(preferred, and(eq(preferred.recipeId, recipes.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.recipeId, recipes.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .leftJoin(
                recipeFavorites,
                and(eq(recipeFavorites.recipeId, recipes.id), eq(recipeFavorites.userId, userId)),
            )
            .where(where);

        return {
            items: rows.map(row =>
                RecipeEntity.from({ ...row.recipe, title: row.title, isFavorite: row.favoritedAt !== null }),
            ),
            total: countRow?.total ?? 0,
        };
    }

    async findById(id: string, userId: string, language: string): Promise<RecipeEntity | null> {
        const preferred = alias(recipeTranslations, 'preferred_recipe_title');
        const fallback = alias(recipeTranslations, 'fallback_recipe_title');
        const categoryPreferred = alias(dishCategoryTranslations, 'preferred_category_name');
        const categoryFallback = alias(dishCategoryTranslations, 'fallback_category_name');
        const cuisinePreferred = alias(cuisineTranslations, 'preferred_cuisine_name');
        const cuisineFallback = alias(cuisineTranslations, 'fallback_cuisine_name');

        const title = sql<string>`coalesce(${preferred.title}, ${fallback.title})`;

        const [row] = await this.db
            .select({
                recipe: recipes,
                title,
                favoritedAt: recipeFavorites.createdAt,
                categoryId: dishCategories.id,
                categorySlug: dishCategories.slug,
                categoryEmoji: dishCategories.emoji,
                categoryImageUrl: dishCategories.imageUrl,
                categorySortOrder: dishCategories.sortOrder,
                categoryName: sql<
                    string | null
                >`coalesce(${categoryPreferred.name}, ${categoryFallback.name}, ${dishCategories.slug})`,
                cuisineId: cuisines.id,
                cuisineSlug: cuisines.slug,
                cuisineEmoji: cuisines.emoji,
                cuisineSortOrder: cuisines.sortOrder,
                cuisineName: sql<
                    string | null
                >`coalesce(${cuisinePreferred.name}, ${cuisineFallback.name}, ${cuisines.slug})`,
            })
            .from(recipes)
            .leftJoin(preferred, and(eq(preferred.recipeId, recipes.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.recipeId, recipes.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .leftJoin(
                recipeFavorites,
                and(eq(recipeFavorites.recipeId, recipes.id), eq(recipeFavorites.userId, userId)),
            )
            .leftJoin(dishCategories, eq(dishCategories.id, recipes.categoryId))
            .leftJoin(
                categoryPreferred,
                and(eq(categoryPreferred.categoryId, dishCategories.id), eq(categoryPreferred.language, language)),
            )
            .leftJoin(
                categoryFallback,
                and(
                    eq(categoryFallback.categoryId, dishCategories.id),
                    eq(categoryFallback.language, DEFAULT_LANGUAGE),
                ),
            )
            .leftJoin(cuisines, eq(cuisines.id, recipes.cuisineId))
            .leftJoin(
                cuisinePreferred,
                and(eq(cuisinePreferred.cuisineId, cuisines.id), eq(cuisinePreferred.language, language)),
            )
            .leftJoin(
                cuisineFallback,
                and(eq(cuisineFallback.cuisineId, cuisines.id), eq(cuisineFallback.language, DEFAULT_LANGUAGE)),
            )
            .where(and(eq(recipes.id, id), this.visibleTo(userId), sql`${title} is not null`));

        if (!row) return null;

        return RecipeEntity.from({
            ...row.recipe,
            title: row.title,
            isFavorite: row.favoritedAt !== null,
            category:
                row.categoryId === null
                    ? null
                    : ReferenceEntity.from({
                          id: row.categoryId,
                          slug: row.categorySlug ?? '',
                          emoji: row.categoryEmoji ?? null,
                          imageUrl: row.categoryImageUrl ?? null,
                          sortOrder: row.categorySortOrder ?? 0,
                          name: row.categoryName ?? row.categorySlug ?? '',
                      }),
            cuisine:
                row.cuisineId === null
                    ? null
                    : ReferenceEntity.from({
                          id: row.cuisineId,
                          slug: row.cuisineSlug ?? '',
                          emoji: row.cuisineEmoji ?? null,
                          sortOrder: row.cuisineSortOrder ?? 0,
                          name: row.cuisineName ?? row.cuisineSlug ?? '',
                      }),
            diets: await this.dietsOf(id, language),
        });
    }

    async ingredientsOf(recipeId: string, language: string): Promise<RecipeIngredientEntity[]> {
        const preferred = alias(productTranslations, 'preferred_product_name');
        const fallback = alias(productTranslations, 'fallback_product_name');

        const rows = await this.db
            .select({
                ingredient: recipeIngredients,
                name: sql<string>`coalesce(${preferred.name}, ${fallback.name}, '')`,
                caloriesPer100g: products.caloriesPer100g,
                proteinPer100g: products.proteinPer100g,
                fatsPer100g: products.fatsPer100g,
                carbsPer100g: products.carbsPer100g,
            })
            .from(recipeIngredients)
            .innerJoin(products, eq(products.id, recipeIngredients.productId))
            .leftJoin(preferred, and(eq(preferred.productId, products.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.productId, products.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(eq(recipeIngredients.recipeId, recipeId))
            .orderBy(asc(recipeIngredients.sortOrder), asc(recipeIngredients.id));

        return rows.map(row => RecipeIngredientEntity.from({ ...row.ingredient, ...row }));
    }

    async stepsOf(recipeId: string, language: string): Promise<RecipeStepEntity[]> {
        const preferred = alias(recipeStepTranslations, 'preferred_step_text');
        const fallback = alias(recipeStepTranslations, 'fallback_step_text');

        const rows = await this.db
            .select({
                step: recipeSteps,
                title: sql<string>`coalesce(${preferred.title}, ${fallback.title}, '')`,
                description: sql<string | null>`coalesce(${preferred.description}, ${fallback.description})`,
            })
            .from(recipeSteps)
            .leftJoin(preferred, and(eq(preferred.stepId, recipeSteps.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.stepId, recipeSteps.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(eq(recipeSteps.recipeId, recipeId))
            .orderBy(asc(recipeSteps.stepNumber));

        return rows.map(row => RecipeStepEntity.from({ ...row.step, title: row.title, description: row.description }));
    }

    async dietsOf(recipeId: string, language: string): Promise<ReferenceEntity[]> {
        const preferred = alias(dietTranslations, 'preferred_diet_name');
        const fallback = alias(dietTranslations, 'fallback_diet_name');

        const rows = await this.db
            .select({
                id: diets.id,
                slug: diets.slug,
                emoji: diets.emoji,
                sortOrder: diets.sortOrder,
                name: sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${diets.slug})`,
            })
            .from(recipeDiets)
            .innerJoin(diets, eq(diets.id, recipeDiets.dietId))
            .leftJoin(preferred, and(eq(preferred.dietId, diets.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.dietId, diets.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(eq(recipeDiets.recipeId, recipeId))
            .orderBy(asc(diets.sortOrder));

        return rows.map(ReferenceEntity.from);
    }

    /** Visible to this account and real — what favouriting checks before it writes. */
    async exists(id: string, userId: string): Promise<boolean> {
        const row = await this.db.query.recipes.findFirst({
            where: and(eq(recipes.id, id), this.visibleTo(userId)),
            columns: { id: true },
        });

        return row !== undefined;
    }

    /** Idempotent: hearting an already-hearted recipe is a no-op, not a conflict. */
    async addFavorite(userId: string, recipeId: string): Promise<void> {
        await this.db.insert(recipeFavorites).values({ userId, recipeId }).onConflictDoNothing();
    }

    async removeFavorite(userId: string, recipeId: string): Promise<void> {
        await this.db
            .delete(recipeFavorites)
            .where(and(eq(recipeFavorites.userId, userId), eq(recipeFavorites.recipeId, recipeId)));
    }

    private visibleTo(userId: string): SQL {
        const visible = or(eq(recipes.source, ContentSource.Global), eq(recipes.createdBy, userId));
        if (!visible) throw new Error('Failed to build recipe visibility clause');
        return visible;
    }

    /**
     * The filter clause, group by group.
     *
     * The combination rule is not uniform, and deliberately so (ADR-0006):
     * groups that describe **what a dish contains** intersect (two chosen
     * ingredients mean both), groups that describe **what a dish is** unite
     * (two chosen cuisines mean either). One rule for all five would always be
     * wrong in one direction — AND across cuisines returns nothing, ever.
     */
    private conditions(userId: string, filters: RecipeFilters, title: SQL<string>): SQL[] {
        const conditions: SQL[] = [this.visibleTo(userId), sql`${title} is not null`];

        if (filters.tab === RecipeTab.Favorite) conditions.push(isNotNull(recipeFavorites.userId));
        if (filters.tab === RecipeTab.Own) conditions.push(eq(recipes.createdBy, userId));

        const query = filters.query?.trim();
        if (query) conditions.push(ilike(title, `%${query}%`));

        // Belonging: either of the chosen ones.
        if (filters.categoryIds?.length) conditions.push(inArray(recipes.categoryId, filters.categoryIds));
        if (filters.cuisineIds?.length) conditions.push(inArray(recipes.cuisineId, filters.cuisineIds));
        if (filters.dietIds?.length) {
            conditions.push(
                exists(
                    this.db
                        .select({ one: sql`1` })
                        .from(recipeDiets)
                        .where(and(eq(recipeDiets.recipeId, recipes.id), inArray(recipeDiets.dietId, filters.dietIds))),
                ),
            );
        }

        // Content: every chosen one, hence one clause each.
        for (const productId of filters.productIds ?? []) {
            conditions.push(
                exists(
                    this.db
                        .select({ one: sql`1` })
                        .from(recipeIngredients)
                        .where(
                            and(eq(recipeIngredients.recipeId, recipes.id), eq(recipeIngredients.productId, productId)),
                        ),
                ),
            );
        }

        for (const groupId of filters.productGroupIds ?? []) {
            conditions.push(
                exists(
                    this.db
                        .select({ one: sql`1` })
                        .from(recipeIngredients)
                        .innerJoin(products, eq(products.id, recipeIngredients.productId))
                        .where(and(eq(recipeIngredients.recipeId, recipes.id), eq(products.groupId, groupId))),
                ),
            );
        }

        // The calorie range is per serving (recipe-filters FR-003), and the
        // stored figure covers the whole dish — so the division happens here
        // rather than in a second stored column free to fall out of step.
        const perServing = sql`(${recipes.calories}::numeric / greatest(${recipes.servings}, 1))`;
        if (filters.caloriesMin !== undefined) conditions.push(sql`${perServing} >= ${filters.caloriesMin}`);
        if (filters.caloriesMax !== undefined) conditions.push(sql`${perServing} <= ${filters.caloriesMax}`);

        return conditions;
    }
}
