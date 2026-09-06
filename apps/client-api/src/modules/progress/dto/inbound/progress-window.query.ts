import { createZodDto } from 'nestjs-zod';

import { progressWindowSchema } from '@dns/validation';

/**
 * How far back a chart reaches. Coerced from the query string and defaulted
 * here rather than in the service, so every progress route answers the same
 * `?days=` and none of them can quietly pick a different default.
 */
export class ProgressWindowQuery extends createZodDto(progressWindowSchema) {}
