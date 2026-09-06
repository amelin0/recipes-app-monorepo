import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateCalories } from './nutrition';

test('applies the Atwater factors', () => {
    assert.equal(calculateCalories({ proteins: 10, carbs: 20, fats: 5 }), 165);
});

test('rounds to a whole kilocalorie', () => {
    // 1.1×4 + 2.2×4 + 0.7×9 = 19.5 — every surface renders integers.
    assert.equal(calculateCalories({ proteins: 1.1, carbs: 2.2, fats: 0.7 }), 20);
});

test('is zero for an empty macro set', () => {
    assert.equal(calculateCalories({ proteins: 0, carbs: 0, fats: 0 }), 0);
});
