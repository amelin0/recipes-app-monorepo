import { z } from 'zod';

import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@dns/constants';
import { ContentSource } from '@dns/shared-types';

const languageSchema = z.string().refine(isSupportedLanguage, value => ({ message: `Unsupported language: ${value}` }));

/**
 * The physical ceiling for something edible, per 100 g.
 *
 * Pure fat is 884 kcal, so nothing above this is food — and that is the only
 * claim being made. It is not a plausibility check but a guard against an
 * order-of-magnitude typo: «cucumber, 1600 kcal» would corrupt the daily total
 * of everyone who ate it, and would be noticed late if at all
 * (product-catalogue FR-011).
 */
const MAX_KCAL_PER_100G = 900;

/** Nothing edible is more than 100 g of anything per 100 g. */
const macroSchema = z.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100 g per 100 g');

const productTranslationSchema = z.object({
    language: languageSchema,
    name: z.string().trim().min(1, 'Name is required').max(200),
    /** The words in front of `servingWeightG` — «1 шт», «1 medium». */
    servingLabel: z
        .string()
        .trim()
        .max(60)
        .nullish()
        .transform(value => value || null),
});

const productBodySchema = z.object({
    groupSlug: z
        .string()
        .trim()
        .min(1)
        .nullish()
        .transform(value => value ?? null),
    caloriesPer100g: z.number().min(0, 'Cannot be negative').max(MAX_KCAL_PER_100G, `Cannot exceed ${MAX_KCAL_PER_100G} kcal per 100 g`),
    proteinPer100g: macroSchema,
    fatsPer100g: macroSchema,
    carbsPer100g: macroSchema,
    servingWeightG: z
        .number()
        .positive('Serving weight must be greater than zero')
        .max(100_000)
        .nullish()
        .transform(value => value ?? null),
    isQuickPick: z.boolean().default(false),
    translations: z.array(productTranslationSchema).min(1, 'At least one translation is required'),
});

export const adminCreateProductSchema = productBodySchema.superRefine((value, ctx) => {
    // Ukrainian is what every read `coalesce`s onto; without it the product
    // shows up nameless in every other locale.
    if (!value.translations.some(t => t.language === DEFAULT_LANGUAGE)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['translations'],
            message: `A '${DEFAULT_LANGUAGE}' translation is required — it is the fallback for every other language`,
        });
    }

    const languages = value.translations.map(t => t.language);
    if (new Set(languages).size !== languages.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['translations'], message: 'Each language may appear only once' });
    }

    // Protein, fat and carbohydrate cannot together weigh more than the food
    // does. Water, ash and fibre make up the rest, so the sum is normally well
    // under 100 — over it means the numbers came from different sources.
    const mass = value.proteinPer100g + value.fatsPer100g + value.carbsPer100g;
    if (mass > 100) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['proteinPer100g'],
            message: `Protein, fats and carbs add up to ${mass.toFixed(1)} g per 100 g — more than the food weighs`,
        });
    }
});

export const adminUpdateProductSchema = adminCreateProductSchema;

export const adminProductListQuerySchema = z.object({
    search: z.string().trim().min(1).max(200).optional(),
    source: z.nativeEnum(ContentSource).optional(),
    isVerified: z
        .enum(['true', 'false'])
        .optional()
        .transform(value => (value === undefined ? undefined : value === 'true')),
    isQuickPick: z
        .enum(['true', 'false'])
        .optional()
        .transform(value => (value === undefined ? undefined : value === 'true')),
    includeArchived: z
        .enum(['true', 'false'])
        .optional()
        .transform(value => value === 'true'),
    language: languageSchema.default(DEFAULT_LANGUAGE),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adminSetProductVerifiedSchema = z.object({ isVerified: z.boolean() });
export const adminSetProductArchivedSchema = z.object({ archived: z.boolean() });

export type AdminCreateProductInput = z.infer<typeof adminCreateProductSchema>;
export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
