import { z } from 'zod';

import { MEASUREMENT_LIMITS, PROGRESS_DEFAULT_DAYS, PROGRESS_MAX_DAYS } from '@dns/constants';
import { BodyMetric, ProgressMetric } from '@dns/shared-types';

import { logDateSchema } from './nutrition.schemas';

/**
 * How much history a progress screen asks for. One parameter for every metric,
 * so the client can keep a period picker in one place.
 */
export const progressWindowSchema = z.object({
    days: z.coerce
        .number()
        .int()
        .min(1, 'Ask for at least one day')
        .max(PROGRESS_MAX_DAYS, `At most ${PROGRESS_MAX_DAYS} days`)
        .optional()
        .default(PROGRESS_DEFAULT_DAYS),
});

export const bodyMetricParamSchema = z.object({ metric: z.nativeEnum(BodyMetric) });
export const progressMetricParamSchema = z.object({ metric: z.nativeEnum(ProgressMetric) });

/**
 * A reading. Ranges come from `MEASUREMENT_LIMITS`, which mirrors the sheet's
 * stepper — the server rejects exactly what the client cannot offer
 * (metric-logging FR-004).
 *
 * Bounds are checked per metric in the service, because which limits apply
 * depends on the path parameter rather than the body.
 */
export const recordMeasurementSchema = z.object({
    value: z.number().positive('A measurement must be positive'),
    /** Defaults to today on the server when the client does not say. */
    measuredOn: logDateSchema.optional(),
});

/** Widest bounds across all three metrics, as a first cheap rejection. */
export const MEASUREMENT_ABSOLUTE_BOUNDS = Object.freeze({
    min: Math.min(...Object.values(MEASUREMENT_LIMITS).map(limit => limit.min)),
    max: Math.max(...Object.values(MEASUREMENT_LIMITS).map(limit => limit.max)),
});

export type ProgressWindowInput = z.infer<typeof progressWindowSchema>;
export type RecordMeasurementInput = z.infer<typeof recordMeasurementSchema>;
