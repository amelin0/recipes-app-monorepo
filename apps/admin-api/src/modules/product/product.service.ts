import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationsProducer } from '@dns/api-common';
import { DEFAULT_LANGUAGE } from '@dns/constants';
import {
    AdminProductDetail,
    AdminProductListItem,
    AdminProductRepository,
    DuplicateProductNameError,
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
        const write = await this.toWriteInput(input);
        return this.refusingDuplicateNames(input, () => this.productRepository.create(write));
    }

    async update(id: string, input: AdminCreateProductInput): Promise<void> {
        const write = await this.toWriteInput(input);
        const updated = await this.refusingDuplicateNames(input, () => this.productRepository.update(id, write));
        if (!updated) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
    }

    /**
     * The CSV import's row: the global product with this English name is
     * updated, or created. One repository call owns the lookup and the write,
     * and it never reaches a user's private product (see the repository).
     */
    async importRow(input: AdminCreateProductInput): Promise<'created' | 'updated'> {
        const write = await this.toWriteInput(input);
        return this.refusingDuplicateNames(input, () => this.productRepository.upsertGlobalByEnglishName(write));
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
     * English names of global products have to stay unique, because the
     * recipe CSV import addresses a product by its English name
     * (`Tomatoes:250`). A duplicate would not fail loudly: the import would
     * pick whichever row came back first, and two dishes claiming the same
     * ingredient could quietly resolve to different products.
     *
     * Enforced by a unique index, not checked here first — a check and a
     * write are two statements, and two requests fit between them. This only
     * translates the index's refusal into the 409 the panel shows.
     */
    private async refusingDuplicateNames<T>(input: AdminCreateProductInput, write: () => Promise<T>): Promise<T> {
        try {
            return await write();
        } catch (error) {
            if (!(error instanceof DuplicateProductNameError)) throw error;

            const english = input.translations.find(t => t.language === 'en')?.name ?? '';
            throw new ConflictException({
                message: `Another product is already called "${english}" in English`,
                code: ProductErrorCode.DuplicateName,
            });
        }
    }
}
