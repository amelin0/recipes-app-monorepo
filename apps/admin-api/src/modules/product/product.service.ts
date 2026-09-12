import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationDedupeKey, NotificationsProducer } from '@dns/api-common';
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
        return this.refusingDuplicateNames(englishNameOf(input), () => this.productRepository.create(write));
    }

    async update(id: string, input: AdminCreateProductInput): Promise<void> {
        const write = await this.toWriteInput(input);
        const updated = await this.refusingDuplicateNames(englishNameOf(input), () =>
            this.productRepository.update(id, write),
        );
        if (!updated) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
    }

    /**
     * The CSV import's row: the global product with this English name is
     * updated, or created. One repository call owns the lookup and the write,
     * and it never reaches a user's private product (see the repository).
     */
    async importRow(input: AdminCreateProductInput): Promise<'created' | 'updated'> {
        const write = await this.toWriteInput(input);
        return this.refusingDuplicateNames(englishNameOf(input), () =>
            this.productRepository.upsertGlobalByEnglishName(write),
        );
    }

    /**
     * Verifying promotes; un-verifying only takes the mark off.
     *
     * The author is told only when **this** call did the promotion — the
     * repository's conditional update decides that, so two admins verifying
     * at once produce one message. Verifying again, or a product that was
     * ours all along, tells nobody. The dedupe key is the second lock on the
     * same door: whatever happens upstream, one product is announced once.
     */
    async setVerified(id: string, isVerified: boolean): Promise<void> {
        if (!isVerified) {
            const updated = await this.productRepository.unverify(id);
            if (!updated) throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
            return;
        }

        const outcome = await this.refusingDuplicateNames(null, () => this.productRepository.verify(id));

        if (outcome.kind === 'not-found') {
            throw new NotFoundException({ message: 'Product not found', code: ProductErrorCode.NotFound });
        }

        if (outcome.kind === 'promoted' && outcome.authorId) {
            await this.notifications.emit(outcome.authorId, NotificationEvent.ProductVerified, {
                subject: outcome.name,
                dedupeKey: NotificationDedupeKey.productVerified(id),
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
    private async refusingDuplicateNames<T>(englishName: string | null, write: () => Promise<T>): Promise<T> {
        try {
            return await write();
        } catch (error) {
            if (!(error instanceof DuplicateProductNameError)) throw error;

            throw new ConflictException({
                message:
                    englishName === null
                        ? 'The catalogue already has a product with this English name'
                        : `Another product is already called "${englishName}" in English`,
                code: ProductErrorCode.DuplicateName,
            });
        }
    }
}

function englishNameOf(input: AdminCreateProductInput): string | null {
    return input.translations.find(t => t.language === 'en')?.name ?? null;
}
