import { z } from 'zod';

import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@dns/constants';

const languageSchema = z.string().refine(isSupportedLanguage, value => ({ message: `Unsupported language: ${value}` }));

const recipeTranslationSchema = z.object({
    language: languageSchema,
    title: z.string().trim().min(1, 'Title is required').max(200),
});

const stepTranslationSchema = z.object({
    language: languageSchema,
    title: z.string().trim().min(1, 'Step title is required').max(200),
    description: z
        .string()
        .trim()
        .max(2000)
        .nullish()
        .transform(value => value ?? null),
});

const ingredientSchema = z.object({
    productId: z.string().uuid('Ingredient must reference a product from the catalogue'),
    amountG: z.number().positive('Amount must be greater than zero').max(100_000),
});

const stepSchema = z.object({
    stepNumber: z.number().int().positive(),
    durationMinutes: z
        .number()
        .int()
        .positive()
        .max(24 * 60)
        .nullish()
        .transform(value => value ?? null),
    translations: z.array(stepTranslationSchema).min(1, 'A step needs text in at least one language'),
    /**
     * Positions in this request's own `ingredients` array, not row ids.
     *
     * The ids do not exist yet on create, and on update the old ones are about
     * to be replaced — so the only stable way to say «this step uses the
     * second ingredient» is to point at the payload.
     */
    ingredientIndexes: z.array(z.number().int().nonnegative()).default([]),
});

const recipeBodySchema = z.object({
    importKey: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .nullish()
        .transform(value => value ?? null),
    categoryId: z
        .string()
        .uuid()
        .nullish()
        .transform(value => value ?? null),
    /**
     * One, not many. A dish belongs to a single cuisine (ADR-0006), and the
     * flat `/tags` façade the panel reads would happily let two through — so
     * the write side stays typed even though the read side is flattened.
     */
    cuisineId: z
        .string()
        .uuid()
        .nullish()
        .transform(value => value ?? null),
    dietIds: z.array(z.string().uuid()).default([]),
    photoUrl: z
        .string()
        .url()
        .nullish()
        .transform(value => value ?? null),
    servings: z.number().int().positive().max(100),
    cookTimeMinutes: z
        .number()
        .int()
        .positive()
        .max(24 * 60)
        .nullish()
        .transform(value => value ?? null),
    translations: z.array(recipeTranslationSchema).min(1, 'At least one translation is required'),
    ingredients: z.array(ingredientSchema).min(1, 'A dish needs at least one ingredient'),
    steps: z.array(stepSchema).default([]),
});

/**
 * Cross-field rules a per-field schema cannot express.
 *
 * All four describe the same class of bug: a payload where every field is
 * individually valid and the whole is incoherent. They belong here rather than
 * in the service because a 422 naming the field is something an editor can
 * fix, while a foreign-key violation surfacing out of the transaction is a 500.
 */
export const adminCreateRecipeSchema = recipeBodySchema.superRefine((value, ctx) => {
    // Ukrainian is what every read `coalesce`s onto. A dish without it renders
    // with an empty title in every other locale.
    if (!value.translations.some(t => t.language === DEFAULT_LANGUAGE)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['translations'],
            message: `A '${DEFAULT_LANGUAGE}' translation is required — it is the fallback for every other language`,
        });
    }

    const languages = value.translations.map(t => t.language);
    if (new Set(languages).size !== languages.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['translations'],
            message: 'Each language may appear only once',
        });
    }

    const numbers = value.steps.map(step => step.stepNumber);
    if (new Set(numbers).size !== numbers.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['steps'], message: 'Step numbers must be unique' });
    }

    value.steps.forEach((step, stepIndex) => {
        step.ingredientIndexes.forEach((position, chipIndex) => {
            if (position >= value.ingredients.length) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['steps', stepIndex, 'ingredientIndexes', chipIndex],
                    message: `No ingredient at position ${position}`,
                });
            }
        });
    });
});

/**
 * The same body, and deliberately not a `.partial()`.
 *
 * `ingredients` and `steps` are replaced wholesale rather than merged, so a
 * partial update would silently wipe them whenever the caller left them out —
 * exactly the mistake an editor's autosave makes at three in the morning.
 * Sending the whole dish makes the replacement visible in the payload.
 */
export const adminUpdateRecipeSchema = adminCreateRecipeSchema;

export const adminRecipeListQuerySchema = z.object({
    search: z.string().trim().min(1).max(200).optional(),
    categoryId: z.string().uuid().optional(),
    cuisineId: z.string().uuid().optional(),
    dietIds: z
        .string()
        .optional()
        .transform(value =>
            value
                ? value
                      .split(',')
                      .map(id => id.trim())
                      .filter(Boolean)
                : undefined,
        )
        .pipe(z.array(z.string().uuid()).optional()),
    language: languageSchema.default(DEFAULT_LANGUAGE),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adminBulkDeleteRecipesSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'Nothing to delete').max(200),
});

export type AdminCreateRecipeInput = z.infer<typeof adminCreateRecipeSchema>;
export type AdminRecipeListQuery = z.infer<typeof adminRecipeListQuerySchema>;
export type AdminBulkDeleteRecipesInput = z.infer<typeof adminBulkDeleteRecipesSchema>;
