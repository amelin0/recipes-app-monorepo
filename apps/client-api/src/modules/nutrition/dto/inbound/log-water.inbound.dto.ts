import { createZodDto } from 'nestjs-zod';

import { logWaterSchema } from '@dns/validation';

export class LogWaterInboundDto extends createZodDto(logWaterSchema) {}
