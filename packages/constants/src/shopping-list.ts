import { ShoppingUnit } from '@dns/shared-types';

/**
 * The stepper on the quantity sheet: how much each unit adds, where it starts,
 * and how far it goes (add-product FR-005).
 *
 * Here rather than in the app because the server rejects exactly what the
 * sheet cannot offer — the same arrangement the measurement sheet uses.
 */
export const SHOPPING_UNIT_LIMITS: Record<ShoppingUnit, { min: number; max: number; step: number; initial: number }> =
    Object.freeze({
        [ShoppingUnit.Serving]: { min: 0.5, max: 20, step: 0.5, initial: 1 },
        [ShoppingUnit.Piece]: { min: 1, max: 100, step: 1, initial: 1 },
        [ShoppingUnit.Gram]: { min: 50, max: 10_000, step: 50, initial: 50 },
    });

/**
 * What one of each unit weighs.
 *
 * One number for every product, which is a simplification the spec makes
 * knowingly: an egg is not 100 g and a serving of rice is not a serving of
 * meat. Converting on the server rather than in the app is what will let that
 * be fixed per product later without shipping a new build — the open question
 * in add-product is about the numbers, not about where they live.
 */
export const SHOPPING_UNIT_GRAMS: Record<ShoppingUnit, number> = Object.freeze({
    [ShoppingUnit.Serving]: 250,
    [ShoppingUnit.Piece]: 100,
    [ShoppingUnit.Gram]: 1,
});

/** The list covers a week of the plan, and asks for it the same way the plan tab does. */
export const SHOPPING_LIST_MAX_RANGE_DAYS = 31;
