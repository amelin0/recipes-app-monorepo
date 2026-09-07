import { z } from 'zod';

import { CATALOG_PAGE_SIZE } from '@dns/constants';

/**
 * The inbox, newest first.
 *
 * `unreadOnly` rather than a `status` filter with two values: the screen has
 * exactly two tabs, «Усі» and «Не прочитані» (inbox FR-003), and a boolean
 * says that without inviting a third state nobody has designed.
 */
export const notificationListQuerySchema = z.object({
    unreadOnly: z
        .union([z.boolean(), z.enum(['true', 'false'])])
        .transform(value => value === true || value === 'true')
        .optional()
        .default(false),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(CATALOG_PAGE_SIZE.max).optional().default(CATALOG_PAGE_SIZE.default),
});

export const notificationIdParamSchema = z.object({ id: z.string().uuid() });

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
