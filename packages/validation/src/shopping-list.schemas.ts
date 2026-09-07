import { z } from 'zod';

import { SHOPPING_UNIT_LIMITS } from '@dns/constants';
import { ShoppingItemOrigin, ShoppingUnit } from '@dns/shared-types';

import { mealPlanRangeSchema } from './meal-plan.schemas';

/**
 * The list shows what a week of the plan needs, so it asks for the window the
 * same way the plan tab does — a client that shows one week on both screens
 * sends the same two dates to both.
 */
export const shoppingListRangeSchema = mealPlanRangeSchema;

/**
 * A quantity as the sheet expresses it: a unit and a number.
 *
 * The grams are computed on the server. The client could multiply just as
 * well, but then «a serving is 250 g» would be frozen into a release, and the
 * spec already has an open question about making it per-product.
 */
export const addShoppingItemSchema = z
    .object({
        productId: z.string().uuid(),
        unit: z.nativeEnum(ShoppingUnit),
        value: z.number().positive('A quantity has to be more than nothing'),
    })
    .superRefine((input, ctx) => {
        const limits = SHOPPING_UNIT_LIMITS[input.unit];

        if (input.value < limits.min || input.value > limits.max) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['value'],
                message: `For ${input.unit}, the amount must be between ${limits.min} and ${limits.max}`,
            });
        }
    });

export const shoppingItemParamSchema = z.object({
    origin: z.nativeEnum(ShoppingItemOrigin),
    productId: z.string().uuid(),
});

export const shoppingProductParamSchema = z.object({ productId: z.string().uuid() });

export type ShoppingListRangeQuery = z.infer<typeof shoppingListRangeSchema>;
export type AddShoppingItemInput = z.infer<typeof addShoppingItemSchema>;
