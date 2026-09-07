import { Injectable, NotFoundException } from '@nestjs/common';

import { SHOPPING_UNIT_GRAMS } from '@dns/constants';
import {
    ProductEntity,
    ProductRepository,
    ReferenceEntity,
    ReferenceRepository,
    ShoppingListRepository,
} from '@dns/database';
import { ShoppingItemOrigin } from '@dns/shared-types';
import { AddShoppingItemInput, ShoppingListRangeQuery } from '@dns/validation';

import { ReaderLanguageService } from '../catalog/reader-language.service';

import { ShoppingListErrorCode } from './shopping-list.errors';

export interface ShoppingItem {
    product: ProductEntity;
    origin: ShoppingItemOrigin;
    amountG: number;
    calories: number;
    purchased: boolean;
}

export interface ShoppingGroup {
    /** Null is «Інше» — a product with no group at all, not a group named «other». */
    group: ReferenceEntity | null;
    items: ShoppingItem[];
}

export interface ShoppingList {
    importFromPlan: boolean;
    groups: ShoppingGroup[];
    /** What the tab badge shows (weekly-list FR-008), counted here so it cannot disagree. */
    visibleCount: number;
}

@Injectable()
export class ShoppingListService {
    constructor(
        private readonly list: ShoppingListRepository,
        private readonly products: ProductRepository,
        private readonly references: ReferenceRepository,
        private readonly language: ReaderLanguageService,
    ) {}

    /**
     * The list as the screen renders it.
     *
     * Manual lines are stored; imported ones are summed over the meal plan on
     * every read. That is what makes the «rules for re-syncing with the plan»
     * the spec leaves open unnecessary: there is nothing to re-sync, because
     * nothing was copied.
     */
    async read(userId: string, query: ShoppingListRangeQuery): Promise<ShoppingList> {
        const language = await this.language.of(userId);
        const importFromPlan = await this.list.importFromPlan(userId);

        const [manual, planned, marks, groups] = await Promise.all([
            this.list.findItems(userId),
            importFromPlan ? this.list.planTotals(userId, query.from, query.to) : Promise.resolve([]),
            this.list.findMarks(userId),
            this.references.shoppingGroups(language),
        ]);

        const products = await this.productsById(
            [...manual, ...planned].map(item => item.productId),
            userId,
            language,
        );

        const isMarked = (productId: string, origin: ShoppingItemOrigin): boolean =>
            marks.some(mark => mark.productId === productId && mark.origin === origin);

        const items: ShoppingItem[] = [
            ...manual.map(item => this.toItem(item, ShoppingItemOrigin.Manual, products, isMarked)),
            ...planned.map(item => this.toItem(item, ShoppingItemOrigin.Plan, products, isMarked)),
        ].flatMap(item => (item ? [item] : []));

        return {
            importFromPlan,
            groups: this.group(items, groups),
            visibleCount: items.length,
        };
    }

    /**
     * Adds a product by hand.
     *
     * The unit arrives as the sheet expressed it and is turned into grams
     * here (add-product FR-007), so «a serving is 250 g» stays a fact the
     * server owns.
     */
    async add(userId: string, input: AddShoppingItemInput): Promise<void> {
        const language = await this.language.of(userId);
        const product = await this.products.findById(input.productId, userId, language);

        if (!product) {
            throw new NotFoundException({
                message: 'No such product',
                code: ShoppingListErrorCode.ProductNotFound,
            });
        }

        const grams = Math.round(input.value * SHOPPING_UNIT_GRAMS[input.unit]);
        await this.list.addItem(userId, input.productId, grams);
    }

    /** Only a manual line can be removed; an imported one has no row to delete. */
    async remove(userId: string, productId: string): Promise<void> {
        if (!(await this.list.removeItem(userId, productId))) {
            throw new NotFoundException({
                message: 'No such item on the list',
                code: ShoppingListErrorCode.ItemNotFound,
            });
        }
    }

    async setPurchased(
        userId: string,
        productId: string,
        origin: ShoppingItemOrigin,
        purchased: boolean,
    ): Promise<void> {
        if (purchased) {
            await this.list.mark(userId, productId, origin);
            return;
        }

        await this.list.unmark(userId, productId, origin);
    }

    async clear(userId: string): Promise<void> {
        await this.list.clear(userId);
    }

    async setImportFromPlan(userId: string, enabled: boolean): Promise<void> {
        await this.list.setImportFromPlan(userId, enabled);
    }

    private async productsById(ids: string[], userId: string, language: string): Promise<Map<string, ProductEntity>> {
        const unique = [...new Set(ids)];
        const found = await this.products.findByIds(unique, userId, language);

        return new Map(found.map(product => [product.id, product]));
    }

    private toItem(
        stored: { productId: string; amountG: number },
        origin: ShoppingItemOrigin,
        products: Map<string, ProductEntity>,
        isMarked: (productId: string, origin: ShoppingItemOrigin) => boolean,
    ): ShoppingItem | null {
        const product = products.get(stored.productId);
        // A product this account can no longer see is dropped rather than
        // rendered as a nameless line.
        if (!product) return null;

        return {
            product,
            origin,
            amountG: stored.amountG,
            calories: Math.round((product.caloriesPer100g * stored.amountG) / 100),
            purchased: isMarked(stored.productId, origin),
        };
    }

    /**
     * Groups in the fixed order the aisles come in, empty ones omitted
     * (weekly-list FR-001). Anything without a group lands in a trailing
     * bucket, so a product can never fall off the screen for lacking one.
     */
    private group(items: ShoppingItem[], groups: ReferenceEntity[]): ShoppingGroup[] {
        const grouped = groups
            .map(group => ({
                group,
                items: items.filter(item => item.product.group?.id === group.id),
            }))
            .filter(entry => entry.items.length > 0);

        const ungrouped = items.filter(item => item.product.group === null);

        return ungrouped.length > 0 ? [...grouped, { group: null, items: ungrouped }] : grouped;
    }
}
