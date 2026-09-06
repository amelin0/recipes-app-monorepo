import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CATALOG_PAGE_SIZE, PRODUCT_MACRO_MAX_PER_100G, RECIPE_CALORIE_FILTER } from '@dns/constants';
import { RecipeTab } from '@dns/shared-types';

import { createProductSchema, productSearchQuerySchema, recipeListQuerySchema } from './catalog.schemas';

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

test('reads a filter group written as one comma-separated parameter', () => {
    const parsed = recipeListQuerySchema.parse({ diets: `${ID_A},${ID_B}` });
    assert.deepEqual(parsed.diets, [ID_A, ID_B]);
});

test('reads the same group written as a repeated parameter', () => {
    const parsed = recipeListQuerySchema.parse({ diets: [ID_A, ID_B] });
    assert.deepEqual(parsed.diets, [ID_A, ID_B]);
});

test('an absent group stays absent rather than becoming an empty filter', () => {
    const parsed = recipeListQuerySchema.parse({});
    assert.equal(parsed.diets, undefined);
    assert.equal(parsed.tab, RecipeTab.All);
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, CATALOG_PAGE_SIZE.default);
});

test('rejects a filter value that is not an id', () => {
    assert.equal(recipeListQuerySchema.safeParse({ cuisines: 'italian' }).success, false);
});

test('refuses a page size above the ceiling', () => {
    assert.equal(recipeListQuerySchema.safeParse({ limit: CATALOG_PAGE_SIZE.max + 1 }).success, false);
    assert.equal(productSearchQuerySchema.safeParse({ limit: CATALOG_PAGE_SIZE.max + 1 }).success, false);
});

test('keeps the calorie range inside the slider it comes from', () => {
    assert.equal(recipeListQuerySchema.safeParse({ caloriesMax: RECIPE_CALORIE_FILTER.max }).success, true);
    assert.equal(recipeListQuerySchema.safeParse({ caloriesMax: RECIPE_CALORIE_FILTER.max + 1 }).success, false);
    assert.equal(recipeListQuerySchema.safeParse({ caloriesMin: -1 }).success, false);
});

test('an unknown tab is refused rather than silently treated as «all»', () => {
    assert.equal(recipeListQuerySchema.safeParse({ tab: 'mine' }).success, false);
});

const product = { name: 'Гречка', proteinPer100g: 12.6, fatsPer100g: 3.3, carbsPer100g: 62 };

test('accepts a custom product without calories — they are derived', () => {
    const parsed = createProductSchema.parse(product);
    assert.equal(parsed.caloriesPer100g, undefined);
});

test('rejects a nameless product', () => {
    assert.equal(createProductSchema.safeParse({ ...product, name: '   ' }).success, false);
});

test('rejects a macro above 100 g per 100 g', () => {
    assert.equal(
        createProductSchema.safeParse({ ...product, proteinPer100g: PRODUCT_MACRO_MAX_PER_100G + 1 }).success,
        false,
    );
});

test('rejects a serving that weighs nothing', () => {
    assert.equal(createProductSchema.safeParse({ ...product, servingWeightG: 0 }).success, false);
});
