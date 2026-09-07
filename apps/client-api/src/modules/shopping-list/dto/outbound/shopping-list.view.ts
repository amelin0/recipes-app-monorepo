import { ApiProperty } from '@nestjs/swagger';

import { ShoppingItemOrigin } from '@dns/shared-types';

import { ReferenceView } from '../../../catalog/dto';
import { ShoppingGroup, ShoppingItem, ShoppingList } from '../../shopping-list.service';

/** One line in the aisle: what to buy, how much, and whether it is already in the basket. */
export class ShoppingItemView {
    @ApiProperty({ format: 'uuid' }) readonly productId: string;
    @ApiProperty() readonly name: string;

    @ApiProperty({
        enum: ShoppingItemOrigin,
        description: 'A manual line can be removed; an imported one follows the plan.',
    })
    readonly origin: ShoppingItemOrigin;

    @ApiProperty({ description: 'Grams. Volume waits for products to carry one (weekly-list FR-002).' })
    readonly amountG: number;

    @ApiProperty({ description: 'What that weight of this product comes to.' })
    readonly calories: number;

    @ApiProperty() readonly purchased: boolean;

    private constructor(item: ShoppingItem) {
        this.productId = item.product.id;
        this.name = item.product.name;
        this.origin = item.origin;
        this.amountG = item.amountG;
        this.calories = item.calories;
        this.purchased = item.purchased;
    }

    static from(item: ShoppingItem): ShoppingItemView {
        return new ShoppingItemView(item);
    }
}

export class ShoppingGroupView {
    @ApiProperty({
        type: ReferenceView,
        nullable: true,
        description: 'Null is «Інше»: a product with no group, not a group called other.',
    })
    readonly group: ReferenceView | null;

    @ApiProperty({ type: [ShoppingItemView] }) readonly items: ShoppingItemView[];

    private constructor(group: ShoppingGroup) {
        this.group = group.group ? ReferenceView.from(group.group) : null;
        this.items = group.items.map(ShoppingItemView.from);
    }

    static from(group: ShoppingGroup): ShoppingGroupView {
        return new ShoppingGroupView(group);
    }
}

export class ShoppingListView {
    @ApiProperty({ description: 'The «Додати з плану» switch; on by default.' })
    readonly importFromPlan: boolean;

    @ApiProperty({ type: [ShoppingGroupView], description: 'In aisle order, empty groups omitted.' })
    readonly groups: ShoppingGroupView[];

    @ApiProperty({ description: 'The tab badge (weekly-list FR-008) — counted server-side so SC-004 holds.' })
    readonly visibleCount: number;

    private constructor(list: ShoppingList) {
        this.importFromPlan = list.importFromPlan;
        this.groups = list.groups.map(ShoppingGroupView.from);
        this.visibleCount = list.visibleCount;
    }

    static from(list: ShoppingList): ShoppingListView {
        return new ShoppingListView(list);
    }
}
