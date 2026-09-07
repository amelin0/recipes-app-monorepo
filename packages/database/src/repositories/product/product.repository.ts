import { Injectable } from '@nestjs/common';
import { SQL, and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { ContentSource } from '@dns/shared-types';

import { ProductEntity, ReferenceEntity } from '../../entities';
import { productGroupTranslations, productGroups, productTranslations, products } from '../../schema';
import { BaseRepository } from '../base.repository';

export interface CreateProductInput {
    name: string;
    language: string;
    groupId?: string | null;
    caloriesPer100g: string;
    proteinPer100g: string;
    fatsPer100g: string;
    carbsPer100g: string;
    servingLabel?: string | null;
    servingWeightG?: string | null;
    createdBy: string;
}

export interface ProductPage {
    items: ProductEntity[];
    total: number;
}

@Injectable()
export class ProductRepository extends BaseRepository {
    /**
     * The catalogue this account may see: everything we ship, plus the products
     * this person created. Someone else's custom product is invisible until an
     * admin promotes it — which is what `source` promotion means.
     */
    private visibleTo(userId: string): SQL {
        const visible = or(eq(products.source, ContentSource.Global), eq(products.createdBy, userId));
        if (!visible) throw new Error('Failed to build product visibility clause');
        return visible;
    }

    async search(params: {
        userId: string;
        language: string;
        query?: string;
        groupId?: string;
        page: number;
        limit: number;
    }): Promise<ProductPage> {
        const conditions: SQL[] = [this.visibleTo(params.userId)];
        if (params.groupId) conditions.push(eq(products.groupId, params.groupId));

        const where = and(...conditions);
        const [items, total] = await Promise.all([
            this.findMany(params.language, where, params.query, {
                limit: params.limit,
                offset: (params.page - 1) * params.limit,
            }),
            this.count(params.language, where, params.query),
        ]);

        return { items, total };
    }

    /**
     * Product search for the admin panel's recipe form.
     *
     * Global products only, and that is a rule rather than a shortcut: a
     * catalogue dish built on somebody's custom product would pin that row in
     * place forever — `recipe_ingredients` references products with ON DELETE
     * RESTRICT — and one person's private entry would quietly become part of
     * everyone's catalogue.
     */
    async searchGlobal(params: {
        language: string;
        query?: string;
        page: number;
        limit: number;
    }): Promise<ProductPage> {
        const where = eq(products.source, ContentSource.Global);

        const [items, total] = await Promise.all([
            this.findMany(params.language, where, params.query, {
                limit: params.limit,
                offset: (params.page - 1) * params.limit,
            }),
            this.count(params.language, where, params.query),
        ]);

        return { items, total };
    }

    /** The fifteen one-tap chips the filter screen opens with (recipe-filters FR-002). */
    async findQuickPicks(language: string): Promise<ProductEntity[]> {
        return this.findMany(language, eq(products.isQuickPick, true));
    }

    async findById(id: string, userId: string, language: string): Promise<ProductEntity | null> {
        const [product] = await this.findMany(language, and(eq(products.id, id), this.visibleTo(userId)));
        return product ?? null;
    }

    async findByIds(ids: string[], userId: string, language: string): Promise<ProductEntity[]> {
        if (ids.length === 0) return [];
        return this.findMany(language, and(inArray(products.id, ids), this.visibleTo(userId)));
    }

    /**
     * The admin counterpart of `findByIds`: global rows only, no owner in the
     * picture. Used when building a catalogue dish, where a private product
     * must not become part of everyone's catalogue.
     */
    async findGlobalByIds(ids: string[], language: string): Promise<ProductEntity[]> {
        if (ids.length === 0) return [];
        return this.findMany(language, and(inArray(products.id, ids), eq(products.source, ContentSource.Global)));
    }

    /**
     * A custom product and its single name land together or not at all: a
     * product row with no translation is invisible to every search, including
     * the search run by the person who just created it.
     */
    async createCustom(input: CreateProductInput): Promise<ProductEntity> {
        return this.db.transaction(async tx => {
            const [row] = await tx
                .insert(products)
                .values({
                    source: ContentSource.Custom,
                    groupId: input.groupId ?? null,
                    caloriesPer100g: input.caloriesPer100g,
                    proteinPer100g: input.proteinPer100g,
                    fatsPer100g: input.fatsPer100g,
                    carbsPer100g: input.carbsPer100g,
                    servingWeightG: input.servingWeightG ?? null,
                    createdBy: input.createdBy,
                })
                .returning();

            if (!row) throw new Error('Failed to insert product');

            await tx.insert(productTranslations).values({
                productId: row.id,
                language: input.language,
                name: input.name,
                servingLabel: input.servingLabel ?? null,
            });

            return ProductEntity.from({
                ...row,
                name: input.name,
                servingLabel: input.servingLabel ?? null,
                group: null,
            });
        });
    }

    private async findMany(
        language: string,
        where: SQL | undefined,
        query?: string,
        page?: { limit: number; offset: number },
    ): Promise<ProductEntity[]> {
        const preferred = alias(productTranslations, 'preferred_product_name');
        const fallback = alias(productTranslations, 'fallback_product_name');
        const groupPreferred = alias(productGroupTranslations, 'preferred_group_name');
        const groupFallback = alias(productGroupTranslations, 'fallback_group_name');

        const name = sql<string>`coalesce(${preferred.name}, ${fallback.name})`;
        const groupName = sql<
            string | null
        >`coalesce(${groupPreferred.name}, ${groupFallback.name}, ${productGroups.slug})`;

        const builder = this.db
            .select({
                product: products,
                name,
                servingLabel: sql<string | null>`coalesce(${preferred.servingLabel}, ${fallback.servingLabel})`,
                groupId: productGroups.id,
                groupSlug: productGroups.slug,
                groupEmoji: productGroups.emoji,
                groupSortOrder: productGroups.sortOrder,
                groupName,
            })
            .from(products)
            .leftJoin(preferred, and(eq(preferred.productId, products.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.productId, products.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .leftJoin(productGroups, eq(productGroups.id, products.groupId))
            .leftJoin(
                groupPreferred,
                and(eq(groupPreferred.groupId, productGroups.id), eq(groupPreferred.language, language)),
            )
            .leftJoin(
                groupFallback,
                and(eq(groupFallback.groupId, productGroups.id), eq(groupFallback.language, DEFAULT_LANGUAGE)),
            )
            // A product with no name in either language is dropped rather than
            // returned nameless — and dropped in SQL, so the page and the total
            // below count the same rows.
            .where(and(where, sql`${name} is not null`, this.nameMatches(name, query)))
            .orderBy(name);

        const rows = page ? await builder.limit(page.limit).offset(page.offset) : await builder;

        return rows.map(row =>
            ProductEntity.from({
                ...row.product,
                name: row.name,
                servingLabel: row.servingLabel,
                group:
                    row.groupId === null
                        ? null
                        : ReferenceEntity.from({
                              id: row.groupId,
                              slug: row.groupSlug ?? '',
                              emoji: row.groupEmoji ?? null,
                              sortOrder: row.groupSortOrder ?? 0,
                              name: row.groupName ?? row.groupSlug ?? '',
                          }),
            }),
        );
    }

    private async count(language: string, where: SQL | undefined, query?: string): Promise<number> {
        const preferred = alias(productTranslations, 'preferred_product_name');
        const fallback = alias(productTranslations, 'fallback_product_name');
        const name = sql<string>`coalesce(${preferred.name}, ${fallback.name})`;

        const [row] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(products)
            .leftJoin(preferred, and(eq(preferred.productId, products.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.productId, products.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(and(where, sql`${name} is not null`, this.nameMatches(name, query)));

        return row?.total ?? 0;
    }

    private nameMatches(name: SQL<string>, query?: string): SQL | undefined {
        const trimmed = query?.trim();
        if (!trimmed) return undefined;
        return ilike(name, `%${trimmed}%`);
    }
}
