import { z } from 'zod';

import { SUPPORTED_LANGUAGES } from '@dns/constants';
import { MetricSystem, ReminderType, Theme } from '@dns/shared-types';

/**
 * The save button stays disabled while the field is empty (profile-edit
 * FR-004), so an empty name never reaches the server as a legitimate value —
 * it is a bug or a hand-written request, and both deserve a 422.
 */
export const displayNameSchema = z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters');

export const updateProfileSchema = z
    .object({
        name: displayNameSchema.optional(),
    })
    .refine(value => Object.keys(value).length > 0, 'Provide at least one field to update');

const languageSchema = z
    .string()
    .refine(value => SUPPORTED_LANGUAGES.includes(value as never), 'Unsupported language');

const unitSchema = z.nativeEnum(MetricSystem);

/**
 * Every field optional: the client sends only the switch it flipped
 * (ADR-0004, rule 4). The `refine` keeps an empty body from counting as a
 * successful no-op update.
 */
export const updateSettingsSchema = z
    .object({
        language: languageSchema.optional(),
        theme: z.nativeEnum(Theme).optional(),
        massUnit: unitSchema.optional(),
        productWeightUnit: unitSchema.optional(),
        lengthUnit: unitSchema.optional(),
        waterUnit: unitSchema.optional(),
    })
    .refine(value => Object.keys(value).length > 0, 'Provide at least one setting to update');

/**
 * `HH:mm` wall-clock, not an instant: «сніданок о 8:00» must stay 8:00 when
 * the user changes time zone. The design steps the minute wheel in fives, but
 * that is a picker concern — rejecting 8:07 here would break the moment the
 * design changes its mind.
 */
export const timeOfDaySchema = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:mm');

const reminderPatchSchema = z
    .object({
        type: z.nativeEnum(ReminderType),
        enabled: z.boolean(),
        time: timeOfDaySchema.optional(),
    })
    .refine(value => (value.type === ReminderType.WeighIn ? value.time === undefined : value.time !== undefined), {
        path: ['time'],
        message: 'Meal reminders require a time; the weigh-in reminder must not carry one',
    });

/**
 * The screen saves as a unit («Зберегти зміни»), so the request carries the
 * whole set rather than one card. Each type may appear once — two patches for
 * breakfast would make the result depend on ordering.
 */
export const updateRemindersSchema = z.object({
    reminders: z
        .array(reminderPatchSchema)
        .min(1, 'Provide at least one reminder')
        .refine(
            items => new Set(items.map(item => item.type)).size === items.length,
            'Each reminder type may appear only once',
        ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateRemindersInput = z.infer<typeof updateRemindersSchema>;
