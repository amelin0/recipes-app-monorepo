import { createZodDto } from 'nestjs-zod';

import { copyPlanDaySchema } from '@dns/validation';

export class CopyPlanDayInboundDto extends createZodDto(copyPlanDaySchema) {}
