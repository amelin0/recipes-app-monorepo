import { z } from 'zod';

import { FeedbackStatus, FeedbackType } from '@dns/shared-types';

export const adminFeedbackListQuerySchema = z.object({
    status: z.nativeEnum(FeedbackStatus).optional(),
    type: z.nativeEnum(FeedbackType).optional(),
    /** The ticket text and the reply address — notes are not searched. */
    search: z.string().trim().min(1).max(200).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Any state to any state. A queue you cannot back out of turns a misclick into
 * a second ticket about the same thing.
 */
export const adminSetFeedbackStatusSchema = z.object({ status: z.nativeEnum(FeedbackStatus) });

export const adminCreateFeedbackNoteSchema = z.object({
    body: z.string().trim().min(1, 'A note cannot be empty').max(4000),
});

export type AdminFeedbackListQuery = z.infer<typeof adminFeedbackListQuerySchema>;
