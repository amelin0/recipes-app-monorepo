import { z } from 'zod';

import { ACTIVITY_LEVEL_RANGE, ONBOARDING_LIMITS } from '@dns/constants';
import { Gender, UserGoal } from '@dns/shared-types';

import { displayNameSchema, targetWeightKgSchema } from './user.schemas';

const bodyMeasure = (limits: { min: number; max: number }, label: string) =>
    z
        .number()
        .min(limits.min, `${label} must be at least ${limits.min}`)
        .max(limits.max, `${label} must be at most ${limits.max}`);

/**
 * A birth date the questionnaire's wheels can produce. The upper bound is the
 * minimum age; the spec leaves the exact number open
 * (`[NEEDS CLARIFICATION]` in FR-006b), so the value lives in
 * `@dns/constants` where changing it is one line.
 */
export const birthDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .refine(value => !Number.isNaN(Date.parse(value)), 'Not a real calendar date')
    .refine(value => {
        const years = (Date.now() - Date.parse(value)) / (365.2425 * 86_400_000);
        return years >= ONBOARDING_LIMITS.age.min && years <= ONBOARDING_LIMITS.age.max;
    }, 'Age is outside the supported range');

/**
 * Every answer is optional here because the questionnaire saves **step by
 * step** (FR-005): each call carries the one answer just given, and the
 * profile fills up as the person moves through. What makes an answer
 * mandatory is the completion check, not this schema.
 *
 * `null` clears an answer — used when going back changes a choice that makes
 * a later one inapplicable (picking «learn to cook» drops the target weight).
 */
export const saveOnboardingStepSchema = z
    .object({
        name: displayNameSchema.optional(),
        gender: z.nativeEnum(Gender).optional(),
        birthDate: birthDateSchema.optional(),
        weightKg: bodyMeasure(ONBOARDING_LIMITS.weightKg, 'Weight').optional(),
        heightCm: bodyMeasure(ONBOARDING_LIMITS.heightCm, 'Height').optional(),
        activityLevel: z
            .number()
            .int()
            .min(ACTIVITY_LEVEL_RANGE.min, 'Activity level must be chosen')
            .max(ACTIVITY_LEVEL_RANGE.max, `Activity level must be at most ${ACTIVITY_LEVEL_RANGE.max}`)
            .optional(),
        goal: z.nativeEnum(UserGoal).optional(),
        targetWeightKg: targetWeightKgSchema.nullable().optional(),
        /** Which step the person is on, so an interrupted questionnaire resumes there. */
        step: z.number().int().min(0).max(ONBOARDING_LIMITS.stepCount).optional(),
    })
    .refine(value => Object.keys(value).length > 0, 'Provide at least one answer');

/**
 * The norms the person accepted or overrode on steps 14–16 (FR-006h). Sent at
 * completion rather than step by step, because they only mean anything
 * together — a calorie target without a water target is not half a goal.
 */
export const completeOnboardingSchema = z.object({
    dailyCalories: z.number().int().positive(),
    dailyWaterMl: z.number().int().positive(),
    dailySteps: z.number().int().nonnegative(),
});

export type SaveOnboardingStepInput = z.infer<typeof saveOnboardingStepSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
