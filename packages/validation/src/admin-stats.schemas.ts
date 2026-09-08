import { z } from 'zod';

import { DEFAULT_LANGUAGE, isSupportedLanguage } from '@dns/constants';

/**
 * The three buttons the screen actually has (FR-004).
 *
 * A free range would promise something the dashboard cannot do — no
 * comparison, no custom axis — and the first person to type `days=365` would
 * get a chart of 365 bars nobody designed.
 */
export const DASHBOARD_PERIODS = [7, 30, 90] as const;

export const adminOverviewQuerySchema = z.object({
    days: z.coerce
        .number()
        .int()
        .refine((value): value is (typeof DASHBOARD_PERIODS)[number] => DASHBOARD_PERIODS.includes(value as never), {
            message: `Period must be one of: ${DASHBOARD_PERIODS.join(', ')}`,
        })
        .default(7),
});

export const adminFavoriteStatsQuerySchema = z.object({
    language: z
        .string()
        .refine(isSupportedLanguage, value => ({ message: `Unsupported language: ${value}` }))
        .default(DEFAULT_LANGUAGE),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type AdminOverviewQuery = z.infer<typeof adminOverviewQuerySchema>;
export type AdminFavoriteStatsQuery = z.infer<typeof adminFavoriteStatsQuerySchema>;
