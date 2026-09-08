import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsProducer } from '@dns/api-common';
import { DEFAULT_LANGUAGE } from '@dns/constants';
import {
    AdminProductDetail,
    AdminProductListItem,
    AdminProductRepository,
    WriteProductInput,
} from '@dns/database';
import { NotificationEvent } from '@dns/shared-types';
import { AdminCreateProductInput, AdminProductListQuery } from '@dns/validation';

import { ProductErrorCode } from './product.errors';

@Injectable()
export class AdminProductService {
    constructor(
        private readonly productRepository: AdminProductRepository,
        private readonly notifications: NotificationsProducer,
    ) {}

    list(query: AdminProductListQuery): Promise<{ items: AdminProductListItem[]; total: number }> {
        return this.productRepository.list({
            language: query.language,
            filters: {
                search: query.search,
                source: query.source,
                isVerified: query.isVerified,
                isQuickPick: query.isQuickPick,
                includeArchived: query.includeArchived,
            },
            page: query.page,
            limit: query.limit,
        });
    }

    async findById(id: string, language: string): Promise<AdminProductDetail> {
        const product = await this.productRepository.findById(id, language);
        if (!product) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
        return product;
    }

    async create(input: AdminCreateProductInput): Promise<string> {
        await this.assertEnglishNameFree(input, null);
        return this.productRepository.create(await this.toWriteInput(input));
    }

    async update(id: string, input: AdminCreateProductInput): Promise<void> {
        await this.assertEnglishNameFree(input, id);

        const updated = await this.productRepository.update(id, await this.toWriteInput(input));
        if (!updated) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
    }

    async setVerified(id: string, isVerified: boolean): Promise<void> {
        // Read before the write: verification clears `createdBy`, so afterwards
        // there is no author left to tell.
        const before = await this.findById(id, DEFAULT_LANGUAGE);

        const updated = await this.productRepository.setVerified(id, isVerified);
        if (!updated) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });

        if (isVerified && before.createdBy) {
            await this.notifications.emit(before.createdBy, NotificationEvent.ProductVerified, {
                subject: before.name,
            });
        }
    }

    async setArchived(id: string, archived: boolean): Promise<void> {
        const updated = await this.productRepository.setArchived(id, archived);
        if (!updated) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
    }

    private async toWriteInput(input: AdminCreateProductInput): Promise<WriteProductInput> {
        return {
            groupId: await this.resolveGroup(input.groupSlug),
            // `numeric` columns take strings so nothing is lost in transit; the
            // conversion happens once, here.
            caloriesPer100g: input.caloriesPer100g.toFixed(2),
            proteinPer100g: input.proteinPer100g.toFixed(2),
            fatsPer100g: input.fatsPer100g.toFixed(2),
            carbsPer100g: input.carbsPer100g.toFixed(2),
            servingWeightG: input.servingWeightG === null ? null : input.servingWeightG.toFixed(2),
            isQuickPick: input.isQuickPick,
            translations: input.translations,
        };
    }

    private async resolveGroup(slug: string | null): Promise<string | null> {
        if (!slug) return null;

        const groupId = await this.productRepository.findGroupIdBySlug(slug);
        if (!groupId) {
            throw new BadRequestException({
                message: `Unknown product group "${slug}"`,
                code: ProductErrorCode.UnknownGroup,
            });
        }

        return groupId;
    }

    /**
     * English names have to stay unique, because the recipe CSV import
     * addresses a product by its English name (`Tomatoes:250`).
     *
     * A duplicate would not fail loudly: the import would pick whichever row
     * came back first, and two dishes claiming the same ingredient could
     * quietly resolve to different products with different macros.
     */
    private async assertEnglishNameFree(input: AdminCreateProductInput, selfId: string | null): Promise<void> {
        const english = input.translations.find(t => t.language === 'en');
        if (!english) return;

        const owner = await this.productRepository.findIdByEnglishName(english.name);
        if (owner && owner !== selfId) {
            throw new ConflictException({
                message: `Another product is already called "${english.name}" in English`,
                code: ProductErrorCode.DuplicateName,
            });
        }
    }
}
