import { createZodDto } from 'nestjs-zod';

import { addPlanItemSchema } from '@dns/validation';

export class AddPlanItemInboundDto extends createZodDto(addPlanItemSchema) {}
