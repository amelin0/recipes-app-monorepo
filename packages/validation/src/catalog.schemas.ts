import { z } from 'zod';

import {
    CATALOG_PAGE_SIZE,
    PRODUCT_CALORIES_MAX_PER_100G,
    PRODUCT_MACRO_MAX_PER_100G,
    PRODUCT_NAME_MAX_LENGTH,
    PRODUCT_SERVING_LABEL_MAX_LENGTH,
    RECIPE_CALORIE_FILTER,
} from '@dns/constants';
import { RecipeTab } from '@dns/shared-types';

/**
 * A filter group arrives either as `?diets=a,b` or as `?diets=a&diets=b`,
 * depending on how the client's HTTP layer serialises arrays. Accepting both
 * costs one line here and saves the mobile app from having to know which one
 * this server happens to want.
 */
const idList = z.preprocess(
    value =>
        typeof value === 'string'
            ? value
                  .split(',')
                  .map(part => part.trim())
                  .filter(Boolean)
            : value,
    z.array(z.string().uuid('Filter values must be ids')).max(50, 'Too many options in one group').optional(),
);

const pagination = {
    page: z.coerce.number().int().min(1, 'Pages start at 1').optional().default(1),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(CATALOG_PAGE_SIZE.max, `At most ${CATALOG_PAGE_SIZE.max} per page`)
        .optional()
        .default(CATALOG_PAGE_SIZE.default),
};

export const productSearchQuerySchema = z.object({
    q: z.string().trim().max(100).optional(),
    groupId: z.string().uuid().optional(),
    ...pagination,
});

export const recipeListQuerySchema = z.object({
    tab: z.nativeEnum(RecipeTab).optional().default(RecipeTab.All),
    q: z.string().trim().max(100).optional(),
    categories: idList,
    cuisines: idList,
    diets: idList,
    products: idList,
    productGroups: idList,
    caloriesMin: z.coerce.number().int().min(RECIPE_CALORIE_FILTER.min).max(RECIPE_CALORIE_FILTER.max).optional(),
    caloriesMax: z.coerce.number().int().min(RECIPE_CALORIE_FILTER.min).max(RECIPE_CALORIE_FILTER.max).optional(),
    ...pagination,
});

export const recipeIdParamSchema = z.object({ id: z.string().uuid() });

const macroPer100g = z.number().min(0).max(PRODUCT_MACRO_MAX_PER_100G, 'A macro cannot exceed 100 g per 100 g');

/**
 * A product somebody adds themselves.
 *
 * Calories are optional because they are derivable — the server fills them from
 * the macros with the Atwater factors rather than trusting a fourth number that
 * can contradict the other three.
 */
export const createProductSchema = z.object({
    name: z.string().trim().min(1, 'Give the product a name').max(PRODUCT_NAME_MAX_LENGTH),
    groupId: z.string().uuid().nullable().optional(),
    proteinPer100g: macroPer100g,
    fatsPer100g: macroPer100g,
    carbsPer100g: macroPer100g,
    caloriesPer100g: z.number().min(0).max(PRODUCT_CALORIES_MAX_PER_100G).optional(),
    servingLabel: z.string().trim().min(1).max(PRODUCT_SERVING_LABEL_MAX_LENGTH).nullable().optional(),
    servingWeightG: z.number().positive('A serving weighs something').max(5000).nullable().optional(),
});

export type ProductSearchQuery = z.infer<typeof productSearchQuerySchema>;
export type RecipeListQuery = z.infer<typeof recipeListQuerySchema>;
export type CreateProductInputDto = z.infer<typeof createProductSchema>;
