import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';

import { ReferenceEntity } from '../../entities';
import {
    cuisineTranslations,
    cuisines,
    dietTranslations,
    diets,
    dishCategories,
    dishCategoryTranslations,
    productGroupTranslations,
    productGroups,
} from '../../schema';
import { BaseRepository } from '../base.repository';

/**
 * The four filter dictionaries, read in one language.
 *
 * Each read joins the wanted language and Ukrainian, and takes the first name
 * that exists. A dictionary row without a translation would otherwise vanish
 * from the filter screen entirely — a chip the design promises, missing with
 * no error anywhere, just because nobody has translated it into Korean yet.
 * The slug is the last resort so the row is never nameless.
 */
@Injectable()
export class ReferenceRepository extends BaseRepository {
    async categories(language: string): Promise<ReferenceEntity[]> {
        const preferred = alias(dishCategoryTranslations, 'preferred_category_name');
        const fallback = alias(dishCategoryTranslations, 'fallback_category_name');

        const rows = await this.db
            .select({
                id: dishCategories.id,
                slug: dishCategories.slug,
                emoji: dishCategories.emoji,
                imageUrl: dishCategories.imageUrl,
                sortOrder: dishCategories.sortOrder,
                name: sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${dishCategories.slug})`,
            })
            .from(dishCategories)
            .leftJoin(preferred, and(eq(preferred.categoryId, dishCategories.id), eq(preferred.language, language)))
            .leftJoin(
                fallback,
                and(eq(fallback.categoryId, dishCategories.id), eq(fallback.language, DEFAULT_LANGUAGE)),
            )
            .orderBy(dishCategories.sortOrder);

        return rows.map(ReferenceEntity.from);
    }

    async cuisines(language: string): Promise<ReferenceEntity[]> {
        const preferred = alias(cuisineTranslations, 'preferred_cuisine_name');
        const fallback = alias(cuisineTranslations, 'fallback_cuisine_name');

        const rows = await this.db
            .select({
                id: cuisines.id,
                slug: cuisines.slug,
                emoji: cuisines.emoji,
                sortOrder: cuisines.sortOrder,
                name: sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${cuisines.slug})`,
            })
            .from(cuisines)
            .leftJoin(preferred, and(eq(preferred.cuisineId, cuisines.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.cuisineId, cuisines.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .orderBy(cuisines.sortOrder);

        return rows.map(ReferenceEntity.from);
    }

    async diets(language: string): Promise<ReferenceEntity[]> {
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
            .from(diets)
            .leftJoin(preferred, and(eq(preferred.dietId, diets.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.dietId, diets.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .orderBy(diets.sortOrder);

        return rows.map(ReferenceEntity.from);
    }

    async productGroups(language: string): Promise<ReferenceEntity[]> {
        const preferred = alias(productGroupTranslations, 'preferred_group_name');
        const fallback = alias(productGroupTranslations, 'fallback_group_name');

        const rows = await this.db
            .select({
                id: productGroups.id,
                slug: productGroups.slug,
                emoji: productGroups.emoji,
                sortOrder: productGroups.sortOrder,
                name: sql<string>`coalesce(${preferred.name}, ${fallback.name}, ${productGroups.slug})`,
            })
            .from(productGroups)
            .leftJoin(preferred, and(eq(preferred.groupId, productGroups.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.groupId, productGroups.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .orderBy(productGroups.sortOrder);

        return rows.map(ReferenceEntity.from);
    }
}
