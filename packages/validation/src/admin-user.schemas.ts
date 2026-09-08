import { z } from 'zod';

/** `'true'` / `'false'` in the query string, boolean by the time it is a filter. */
const optionalBoolean = z
    .enum(['true', 'false'])
    .optional()
    .transform(value => (value === undefined ? undefined : value === 'true'));

export const adminUserListQuerySchema = z.object({
    /** Matched against the address and the profile name. */
    search: z.string().trim().min(1).max(200).optional(),
    isBlocked: optionalBoolean,
    isEmailVerified: optionalBoolean,
    hasSubscription: optionalBoolean,
    /**
     * `overdue` is the one the panel counts: the grace period has passed and
     * nothing has happened, because the executor does not exist yet (ADR-0005).
     */
    deletion: z.enum(['none', 'active', 'overdue']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adminSetUserBlockedSchema = z.object({ blocked: z.boolean() });

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
