import { createZodDto } from 'nestjs-zod';

import { logMealSchema } from '@dns/validation';

export class LogMealInboundDto extends createZodDto(logMealSchema) {}
