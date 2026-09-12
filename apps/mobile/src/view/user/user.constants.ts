import type { FeedbackType } from '@/data';

/** How long a deleted account can still be restored (804:25371). */
export const ACCOUNT_RECOVERY_DAYS = 30;

export const FEEDBACK_KINDS = ['bug', 'broken', 'improvement', 'feature', 'other'] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

/**
 * The five cards the design names, mapped to what the API calls them. Kept as
 * a table rather than renaming the design's keys: the translation keys and
 * the Figma frames both read `broken`/`feature`, and a silent rename would
 * make the locale file disagree with the screen it describes.
 */
export const FEEDBACK_KIND_TO_API: Record<FeedbackKind, FeedbackType> = {
    bug: 'bug',
    broken: 'not_working',
    improvement: 'improvement',
    feature: 'feature_request',
    other: 'other',
};

export const FEEDBACK_DESCRIPTION_MIN = 10;
export const FEEDBACK_DESCRIPTION_MAX = 1000;
export const FEEDBACK_MAX_PHOTOS = 3;
