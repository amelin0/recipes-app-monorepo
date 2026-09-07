import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SHOPPING_UNIT_LIMITS } from '@dns/constants';
import { ShoppingItemOrigin, ShoppingUnit } from '@dns/shared-types';

import { addShoppingItemSchema, shoppingItemParamSchema } from './shopping-list.schemas';

const productId = '11111111-1111-4111-8111-111111111111';

test('accepts a quantity inside its own unit’s range', () => {
    for (const unit of Object.values(ShoppingUnit)) {
        const limits = SHOPPING_UNIT_LIMITS[unit];
        assert.equal(addShoppingItemSchema.safeParse({ productId, unit, value: limits.initial }).success, true, unit);
    }
});

test('each unit has its own bounds, not a shared one', () => {
    // 2 is fine as pieces and as servings, but below the gram minimum.
    assert.equal(addShoppingItemSchema.safeParse({ productId, unit: ShoppingUnit.Piece, value: 2 }).success, true);
    assert.equal(addShoppingItemSchema.safeParse({ productId, unit: ShoppingUnit.Gram, value: 2 }).success, false);
});

test('refuses a quantity above the stepper’s ceiling', () => {
    assert.equal(
        addShoppingItemSchema.safeParse({
            productId,
            unit: ShoppingUnit.Gram,
            value: SHOPPING_UNIT_LIMITS[ShoppingUnit.Gram].max + 1,
        }).success,
        false,
    );
});

test('refuses nothing at all, and an unknown unit', () => {
    assert.equal(addShoppingItemSchema.safeParse({ productId, unit: ShoppingUnit.Gram, value: 0 }).success, false);
    assert.equal(addShoppingItemSchema.safeParse({ productId, unit: 'litre', value: 1 }).success, false);
});

test('a tick names both the product and where the line came from', () => {
    assert.equal(shoppingItemParamSchema.safeParse({ origin: ShoppingItemOrigin.Plan, productId }).success, true);
    assert.equal(shoppingItemParamSchema.safeParse({ origin: 'imported', productId }).success, false);
});
