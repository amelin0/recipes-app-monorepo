import { z } from 'zod';

import { ONBOARDING_LIMITS, SUPPORTED_LANGUAGES } from '@dns/constants';
import { FeedbackType, MetricSystem, ReminderType, StorageScope, Theme } from '@dns/shared-types';

import { emailSchema } from './auth.schemas';

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

/**
 * The weight the user is working towards.
 *
 * Editable outside the questionnaire because the progress screen's weight card
 * shows the goal and offers to change it (progress metric-detail FR-005), and
 * the alternative — a `/progress` route writing the same column — would give
 * one number two owners. `null` drops the goal.
 */
export const targetWeightKgSchema = z
    .number()
    .min(ONBOARDING_LIMITS.weightKg.min, `Target weight must be at least ${ONBOARDING_LIMITS.weightKg.min}`)
    .max(ONBOARDING_LIMITS.weightKg.max, `Target weight must be at most ${ONBOARDING_LIMITS.weightKg.max}`);

/**
 * `photoUrl` must be a URL this user obtained from `POST /uploads` — the
 * service checks that before storing it. Validating only the shape here would
 * let any address be written into a profile that every viewer then fetches.
 * `null` clears the photo.
 */
export const updateProfileSchema = z
    .object({
        name: displayNameSchema.optional(),
        photoUrl: z.string().url('Must be a valid URL').nullable().optional(),
        targetWeightKg: targetWeightKgSchema.nullable().optional(),
    })
    .refine(value => Object.keys(value).length > 0, 'Provide at least one field to update');

const languageSchema = z.string().refine(value => SUPPORTED_LANGUAGES.includes(value as never), 'Unsupported language');

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

/**
 * Asking for permission to upload one file. The server signs the type and
 * size into the grant, so both must be declared up front — after the URL is
 * handed out there is nothing left to check.
 */
export const presignUploadSchema = z.object({
    scope: z.nativeEnum(StorageScope),
    fileName: z.string().trim().min(1, 'File name is required').max(255, 'File name is too long'),
    contentType: z.string().trim().min(1, 'Content type is required'),
    /**
     * The exact byte length. It is signed into the grant, so an upload of any
     * other size is rejected by the object store with an opaque 403 — the
     * client cannot estimate here.
     */
    size: z.number().int().positive('Size must be a positive number of bytes'),
});

export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

/**
 * A support ticket. Validation runs on submit, not while typing (feedback
 * FR-004), so the messages name what to fix rather than nudging mid-entry.
 */
export const createFeedbackSchema = z.object({
    type: z.nativeEnum(FeedbackType),
    description: z
        .string()
        .trim()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description must be at most 1000 characters'),
    /** Public URLs from `POST /uploads` with the `feedback` scope; ownership is checked server-side. */
    imageUrls: z.array(z.string().url('Must be a valid URL')).max(3, 'At most 3 images').optional(),
    /**
     * Optional (FR-006), and a blank field means «not given»: the form keeps
     * an untouched input as `''`, and refusing that would make the optional
     * field mandatory to anyone who never tapped it.
     */
    replyEmail: z.preprocess(
        value => (value === null || (typeof value === 'string' && value.trim() === '') ? undefined : value),
        emailSchema.optional(),
    ),
    /**
     * App version, platform, OS build — whatever the client can say about
     * itself (FR-008). Deliberately open: the spec leaves the exact set
     * undecided, and a fixed shape would reject a client that learns to
     * report one more thing.
     */
    context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
