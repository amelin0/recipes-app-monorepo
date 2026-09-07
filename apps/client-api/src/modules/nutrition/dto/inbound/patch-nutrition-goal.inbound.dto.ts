import { createZodDto } from 'nestjs-zod';

import { patchNutritionGoalSchema } from '@dns/validation';

export class PatchNutritionGoalInboundDto extends createZodDto(patchNutritionGoalSchema) {}
