import { Injectable } from '@nestjs/common';
import { SQL, and, asc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { ContentSource } from '@dns/shared-types';

import { productGroups, productTranslations, products, recipeIngredients } from '../../schema';
import { BaseRepository, DrizzleDB } from '../base.repository';

// Declared once. Building them inside each method produced distinct objects
// that merely shared a name, so a `where` referring to one and a `from`
// joining another lined up by coincidence rather than by construction.
const preferred = alias(productTranslations, 'preferred_name');
const fallback = alias(productTranslations, 'fallback_name');
const english = alias(productTranslations, 'english_name');

/** The reader's language, then Ukrainian, then nothing rather than a null row. */
const NAME = sql<string>`coalesce(${preferred.name}, ${fallback.name}, '')`;

export interface AdminProductFilters {
    search?: string;
    source?: ContentSource;
    isVerified?: boolean;
    isQuickPick?: boolean;
    /** Archived rows stay hidden unless asked for — see the schema comment. */
    includeArchived?: boolean;
}

export interface AdminProductListItem {
    id: string;
    name: string;
    nameEn: string | null;
    source: ContentSource;
    groupId: string | null;
    groupSlug: string | null;
    caloriesPer100g: string;
    proteinPer100g: string;
    fatsPer100g: string;
    carbsPer100g: string;
    servingWeightG: string | null;
    isQuickPick: boolean;
    isVerified: boolean;
    createdBy: string | null;
    archivedAt: Date | null;
    createdAt: Date;
}

export interface AdminProductTranslation {
    language: string;
    name: string;
    servingLabel: string | null;
}

export interface AdminProductDetail extends AdminProductListItem {
    translations: AdminProductTranslation[];
    /** How many catalogue dishes use it — what the archive dialog reports. */
    usedInRecipes: number;
}

export interface WriteProductInput {
    groupId: string | null;
    caloriesPer100g: string;
    proteinPer100g: string;
    fatsPer100g: string;
    carbsPer100g: string;
    servingWeightG: string | null;
    isQuickPick: boolean;
    translations: AdminProductTranslation[];
}

@Injectable()
export class AdminProductRepository extends BaseRepository {
    async list(params: {
        language: string;
        filters: AdminProductFilters;
        page: number;
        limit: number;
    }): Promise<{ items: AdminProductListItem[]; total: number }> {
        const where = and(...this.conditions(params.filters));

        const [items, total] = await Promise.all([
            this.fetchList(params.language, where, {
                limit: params.limit,
                offset: (params.page - 1) * params.limit,
            }),
            this.count(params.language, where),
        ]);

        return { items, total };
    }

    async findById(id: string, language: string): Promise<AdminProductDetail | null> {
        // No archived filter here, deliberately: the edit page has to be able
        // to open an archived product, or un-archiving it would be unreachable.
        const [row] = await this.fetchList(language, eq(products.id, id), { limit: 1, offset: 0 });

        if (!row) return null;

        const [translations, usage] = await Promise.all([
            this.db
                .select({
                    language: productTranslations.language,
                    name: productTranslations.name,
                    servingLabel: productTranslations.servingLabel,
                })
                .from(productTranslations)
                .where(eq(productTranslations.productId, id)),
            this.db
                .select({ total: sql<number>`count(distinct ${recipeIngredients.recipeId})::int` })
                .from(recipeIngredients)
                .where(eq(recipeIngredients.productId, id)),
        ]);

        return { ...row, translations, usedInRecipes: usage[0]?.total ?? 0 };
    }

    async create(input: WriteProductInput): Promise<string> {
        return this.db.transaction(async tx => {
            const [row] = await tx
                .insert(products)
                .values({
                    // Anything an admin creates joins the shared catalogue. A
                    // staff-owned private product would be a contradiction —
                    // there is no admin-facing app to eat it in.
                    source: ContentSource.Global,
                    createdBy: null,
                    isVerified: true,
                    groupId: input.groupId,
                    caloriesPer100g: input.caloriesPer100g,
                    proteinPer100g: input.proteinPer100g,
                    fatsPer100g: input.fatsPer100g,
                    carbsPer100g: input.carbsPer100g,
                    servingWeightG: input.servingWeightG,
                    isQuickPick: input.isQuickPick,
                })
                .returning({ id: products.id });

            if (!row) throw new Error('Failed to insert product');

            await this.writeTranslations(tx, row.id, input.translations);

            return row.id;
        });
    }

    async update(id: string, input: WriteProductInput): Promise<boolean> {
        return this.db.transaction(async tx => {
            const updated = await tx
                .update(products)
                .set({
                    groupId: input.groupId,
                    caloriesPer100g: input.caloriesPer100g,
                    proteinPer100g: input.proteinPer100g,
                    fatsPer100g: input.fatsPer100g,
                    carbsPer100g: input.carbsPer100g,
                    servingWeightG: input.servingWeightG,
                    isQuickPick: input.isQuickPick,
                })
                .where(eq(products.id, id))
                .returning({ id: products.id });

            if (updated.length === 0) return false;

            // Replaced wholesale rather than merged: a language the caller
            // omitted is a language they removed, and merging would make
            // deleting a translation impossible through this route.
            await tx.delete(productTranslations).where(eq(productTranslations.productId, id));
            await this.writeTranslations(tx, id, input.translations);

            return true;
        });
    }

    /**
     * Confirms a user's product and promotes it into the shared catalogue
     * (decision of 2026-09-08).
     *
     * `createdBy` is cleared, and that is deliberate rather than tidy: once a
     * product is visible to everyone and sits inside other people's dishes it
     * has stopped being one person's data, and the cleared column is what
     * stops a later account deletion from taking it back out.
     *
     * Un-verifying therefore does not hand it back — there is no owner left to
     * hand it to. That asymmetry is the cost of the decision, not an oversight.
     */
    async setVerified(id: string, isVerified: boolean): Promise<boolean> {
        const updated = await this.db
            .update(products)
            .set(
                isVerified ? { isVerified: true, source: ContentSource.Global, createdBy: null } : { isVerified: false },
            )
            .where(eq(products.id, id))
            .returning({ id: products.id });

        return updated.length > 0;
    }

    /** FR-008: out of the catalogue without touching anything that references it. */
    async setArchived(id: string, archived: boolean): Promise<boolean> {
        const updated = await this.db
            .update(products)
            .set({ archivedAt: archived ? new Date() : null })
            .where(eq(products.id, id))
            .returning({ id: products.id });

        return updated.length > 0;
    }

    /**
     * The import's natural key: English is what a recipe CSV names a product
     * by (`Tomatoes:250`), so it is the identity that already exists — unlike
     * recipes, which needed an `import_key` invented for them.
     */
    async findIdByEnglishName(name: string): Promise<string | null> {
        const [row] = await this.db
            .select({ id: products.id })
            .from(productTranslations)
            .innerJoin(products, eq(products.id, productTranslations.productId))
            .where(and(eq(productTranslations.language, 'en'), ilike(productTranslations.name, name)))
            .limit(1);

        return row?.id ?? null;
    }

    /** Resolves `product_groups.slug` → id, for the form and the CSV import. */
    async findGroupIdBySlug(slug: string): Promise<string | null> {
        const [row] = await this.db
            .select({ id: productGroups.id })
            .from(productGroups)
            .where(eq(productGroups.slug, slug))
            .limit(1);

        return row?.id ?? null;
    }

    /**
     * The list projection, shared by the page query and by `findById`.
     *
     * One place rather than two: they have to agree on the joins, and a filter
     * that reads a joined column would otherwise mean something different in
     * each.
     */
    private async fetchList(
        language: string,
        where: SQL | undefined,
        page: { limit: number; offset: number },
    ): Promise<AdminProductListItem[]> {
        return this.db
            .select({
                id: products.id,
                name: NAME,
                nameEn: english.name,
                source: products.source,
                groupId: products.groupId,
                groupSlug: productGroups.slug,
                caloriesPer100g: products.caloriesPer100g,
                proteinPer100g: products.proteinPer100g,
                fatsPer100g: products.fatsPer100g,
                carbsPer100g: products.carbsPer100g,
                servingWeightG: products.servingWeightG,
                isQuickPick: products.isQuickPick,
                isVerified: products.isVerified,
                createdBy: products.createdBy,
                archivedAt: products.archivedAt,
                createdAt: products.createdAt,
            })
            .from(products)
            .leftJoin(preferred, and(eq(preferred.productId, products.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.productId, products.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .leftJoin(english, and(eq(english.productId, products.id), eq(english.language, 'en')))
            .leftJoin(productGroups, eq(productGroups.id, products.groupId))
            .where(where)
            .orderBy(asc(NAME))
            .limit(page.limit)
            .offset(page.offset);
    }

    private async count(language: string, where: SQL | undefined): Promise<number> {
        const [row] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(products)
            .leftJoin(preferred, and(eq(preferred.productId, products.id), eq(preferred.language, language)))
            .leftJoin(fallback, and(eq(fallback.productId, products.id), eq(fallback.language, DEFAULT_LANGUAGE)))
            .where(where);

        return row?.total ?? 0;
    }

    private async writeTranslations(
        tx: DrizzleDB,
        productId: string,
        translations: AdminProductTranslation[],
    ): Promise<void> {
        await tx.insert(productTranslations).values(
            translations.map(t => ({
                productId,
                language: t.language,
                name: t.name,
                servingLabel: t.servingLabel,
            })),
        );
    }

    private conditions(filters: AdminProductFilters): SQL[] {
        const conditions: SQL[] = [];

        if (!filters.includeArchived) conditions.push(isNull(products.archivedAt));
        if (filters.source) conditions.push(eq(products.source, filters.source));
        if (filters.isVerified !== undefined) conditions.push(eq(products.isVerified, filters.isVerified));
        if (filters.isQuickPick !== undefined) conditions.push(eq(products.isQuickPick, filters.isQuickPick));
        if (filters.search) conditions.push(ilike(NAME, `%${filters.search}%`));

        return conditions;
    }
}
