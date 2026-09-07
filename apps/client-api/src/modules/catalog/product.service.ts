import { BadRequestException, Injectable } from '@nestjs/common';

import { calculateCalories } from '@dns/constants';
import { ProductEntity, ProductRepository, ReferenceRepository } from '@dns/database';
import { CreateProductInputDto, ProductSearchQuery } from '@dns/validation';

import { CatalogErrorCode } from './catalog.errors';
import { ReaderLanguageService } from './reader-language.service';

export interface ProductSearchResult {
    items: ProductEntity[];
    total: number;
}

@Injectable()
export class ProductService {
    constructor(
        private readonly products: ProductRepository,
        private readonly references: ReferenceRepository,
        private readonly language: ReaderLanguageService,
    ) {}

    async search(userId: string, query: ProductSearchQuery): Promise<ProductSearchResult> {
        const language = await this.language.of(userId);

        return this.products.search({
            userId,
            language,
            query: query.q,
            groupId: query.groupId,
            page: query.page,
            limit: query.limit,
        });
    }

    /**
     * A product somebody adds for themselves.
     *
     * Calories are derived from the macros unless the caller insists on a
     * figure: `calculateCalories` is the single definition of a calorie count
     * in this system, and a stored number that disagrees with the three it is
     * made of would be wrong on exactly the screens that show both.
     *
     * The name is written in the reader's own language and nowhere else — a
     * custom product has no other translation, which is also why it stays
     * invisible to accounts reading in a different one.
     */
    async create(userId: string, input: CreateProductInputDto): Promise<ProductEntity> {
        if (input.groupId) await this.assertGroupExists(userId, input.groupId);

        const calories =
            input.caloriesPer100g ??
            calculateCalories({ proteins: input.proteinPer100g, carbs: input.carbsPer100g, fats: input.fatsPer100g });

        return this.products.createCustom({
            name: input.name,
            language: await this.language.of(userId),
            groupId: input.groupId ?? null,
            caloriesPer100g: calories.toFixed(2),
            proteinPer100g: input.proteinPer100g.toFixed(2),
            fatsPer100g: input.fatsPer100g.toFixed(2),
            carbsPer100g: input.carbsPer100g.toFixed(2),
            servingLabel: input.servingLabel ?? null,
            servingWeightG: input.servingWeightG?.toFixed(2) ?? null,
            createdBy: userId,
        });
    }

    /**
     * Checked before the insert rather than left to the foreign key: a bad id
     * would otherwise surface as a 500 with a constraint name in it, which
     * tells the client nothing it can act on.
     */
    private async assertGroupExists(userId: string, groupId: string): Promise<void> {
        const language = await this.language.of(userId);
        const groups = await this.references.productGroups(language);

        if (!groups.some(group => group.id === groupId)) {
            throw new BadRequestException({
                message: 'No such product group',
                code: CatalogErrorCode.UnknownProductGroup,
            });
        }
    }
}
