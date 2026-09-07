import { createZodDto } from 'nestjs-zod';

import { bodyMetricParamSchema, progressMetricParamSchema } from '@dns/validation';

/** Any of the nine cards — the detail route reads all of them. */
export class ProgressMetricParam extends createZodDto(progressMetricParamSchema) {}

/**
 * Only the three the user actually measures. Writing is narrower than reading
 * on purpose: calories, water and steps are owned by the nutrition domain, and
 * a second write path into them would let the same number be set two ways.
 */
export class BodyMetricParam extends createZodDto(bodyMetricParamSchema) {}
