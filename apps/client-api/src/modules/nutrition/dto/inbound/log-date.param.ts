import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { logDateSchema } from '@dns/validation';

/**
 * Validates the `:date` segment the same way a body field would be. Without
 * this the path would accept any string and a typo would silently create a
 * day nobody can find again.
 */
export class LogDateParam extends createZodDto(z.object({ date: logDateSchema })) {}
