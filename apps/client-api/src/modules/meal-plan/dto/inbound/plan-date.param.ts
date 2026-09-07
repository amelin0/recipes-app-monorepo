import { createZodDto } from 'nestjs-zod';

import { planDateParamSchema } from '@dns/validation';

export class PlanDateParam extends createZodDto(planDateParamSchema) {}
